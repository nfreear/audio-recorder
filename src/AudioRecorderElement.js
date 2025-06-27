import MyMinElement from 'MyMinElement';

const { Blob, customElements, Event, MediaRecorder, navigator } = window;

export class AudioRecorderEvent extends Event {
  constructor (origEvent) {
    super('audio-recorder', { bubbles: true });
    // Was: super(`audio-recorder:${origEvent.type}`, { bubbles: true });
    this._origEvent = origEvent;
  }

  get origEvent () { return this._origEvent; }
  get origTarget () { return this.origEvent.target || {}; }
  get audioBitsPerSecond () { return this.origTarget.audioBitsPerSecond; }
  get mimeType () { return this.origTarget.mimeType || null; }
  get error () { return this.origEvent.error; }
  get message () { return this.origEvent.error ? this.origEvent.error.message : null; }
  get eventName () { return this.origEvent.type; } // : this._type; }
  is (eventName) { return this.eventName === eventName; }
}

/**
 * @customElement audio-recorder
 */
export class AudioRecorderElement extends MyMinElement {
  constructor () {
    super();
    this._duration = null;
    this._chunks = [];
  }

  get audioBlob () { return this._audioBlob; }

  get duration () { return this._duration; }

  /* Deprecated */
  set onstopevent (callbackFn) {
    this._stopCallbackFn = callbackFn;
  }

  get onstopevent () { return this._stopCallbackFn; }

  get _template () {
    return `
<template>
  <form>
    <audio controls part="audio"></audio>
    <p part="row">
      <button name="startButton" part="button">Record</button>
      <button name="stopButton" part="button" disabled>Stop</button>
      <output name="output"></output>
    </p>
  </form>
</template>
`;
  }

  get _elements () {
    return this.shadowRoot.querySelector('form').elements;
  }

  get _audioElement () { return this.shadowRoot.querySelector('audio'); }

  connectedCallback () {
    this._attachLocalTemplate(this._template);

    this._elements.startButton.addEventListener('click', (ev) => this._onStartClick(ev));
    this._elements.stopButton.addEventListener('click', (ev) => this._onStopClick(ev));
  }

  _getUserMedia () {
    const constraints = { audio: true, video: false };
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  _onStartClick (ev) {
    ev.preventDefault();
    this._getUserMedia().then((stream) => {
      const audioTracks = stream.getAudioTracks();

      console.debug(`Using audio device: ${audioTracks[0].label}`);

      stream.onremovetrack = () => {
        console.debug('Stream ended');
      };

      this._recorder = new MediaRecorder(stream);

      this._recorder.addEventListener('dataavailable', (dataEvent) => {
        this._chunks.push(dataEvent.data);
        this._fireEvent(dataEvent);
      });

      this._recorder.addEventListener('stop', (stopEvent) => {
        const type = this._recorder.mimeType;
        const audioBlob = this._audioBlob = new Blob(this._chunks, { type });

        /* Deprecated */
        if (this._stopCallbackFn) {
          this._stopCallbackFn({ audioBlob, type });
        }

        this._audioElement.src = this.createAudioURL();
        this._getAudioDuration();

        this._fireEvent(stopEvent, `Recording stopped (${this.duration})`);

        this._elements.startButton.disabled = false;
        this._elements.stopButton.disabled = true;
      });

      this._elements.startButton.disabled = true;
      this._elements.stopButton.disabled = false;

      this._recorder.start();
      this._fireEvent({
        audioTracks,
        audioDevice: audioTracks[0].label,
        target: this._recorder,
        type: 'start'
      },
      'Recording…');
    })
      .catch((error) => {
        this._fireEvent({ error, type: 'error', target: this._recorder }, `Error: ${error.message}`);
        console.warn('Audio Recorder Error:', error);
      });
  }

  createAudioURL () {
    return window.URL.createObjectURL(this.audioBlob);
  }

  _getAudioDuration () {
    this._audioElement.load();
    this._audioElement.play();
    setTimeout(() => {
      this._duration = this._audioElement.duration;
      console.debug('Duration:', this.duration);
      this._audioElement.pause();
      this._audioElement.load();
    },
    150); // 150ms is about correct, maybe?!
  }

  _onStopClick (ev) {
    ev.preventDefault();
    this._recorder.stop();
    console.debug('stop called:', ev);
  }

  _fireEvent (origEvent, message = null) {
    const event = new AudioRecorderEvent(origEvent);
    if (event.is('error')) {
      this.dataset.error = event.error.name;
    }
    this.dataset.state = event.eventName;
    this._elements.output.setAttribute('part', `output ${event.eventName}`);
    this._elements.output.value = message || event.message || event.eventName;
    this.dispatchEvent(event);
  }
}

customElements.define('audio-recorder', AudioRecorderElement);
