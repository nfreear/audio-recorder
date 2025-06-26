import MyMinElement from 'MyMinElement';

const { customElements, Event, navigator } = window;

export class AudioRecorderEvent extends Event {
  constructor (origEvent) {
    super(`audio-recorder:${origEvent.type}`, { bubbles: true });
    this._origEvent = origEvent;
  }

  get origEvent () { return this._origEvent; }
  get origTarget () { return this.origEvent.target; }
  get audioBitsPerSecond () { return this.origTarget.audioBitsPerSecond; }
  get mimeType () { return this.origTarget.mimeType; }
  get error () { return this.origEvent.error; }
}

/**
 * @customElement audio-recorder
 */
export class AudioRecorderElement extends MyMinElement {
  constructor () {
    super();
    this._chunks = [];
  }

  set onstopevent (callbackFn) {
    this._stopCallbackFn = callbackFn;
  }

  get _template () {
    return `
<template>
  <form>
    <audio controls part="audio"></audio>
    <p part="row">
      <button name="startButton" part="button">Start</button>
      <button name="stopButton" part="button">Stop</button>
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
        // console.debug('Data available:', daEv);
      });

      this._recorder.addEventListener('stop', (stopEvent) => {
        const type = this._recorder.mimeType;
        const audioBlob = this._audioBlob = new Blob(this._chunks, { type });

        if (this._stopCallbackFn) {
          this._stopCallbackFn({ audioBlob, type });
        }

        this._audioElement.src = this.createAudioURL();

        this._fireEvent(stopEvent);

        // console.debug('Recorder stop:', type, sEv);
      });

      this._recorder.start();
      this._fireEvent({
        audioTracks,
        audioDevice: audioTracks[0].label,
        target: this._recorder,
        type: 'start'
      })

      // audioElement.srcObject = stream;
    })
    .catch((error) => {
      this._fireEvent({ error, type: 'error' });
      console.error('Audio Error:', error);
    });
  }

  get audioBlob () { return this._audioBlob; }

  createAudioURL () {
    return window.URL.createObjectURL(this.audioBlob)
  }

  _onStopClick (ev) {
    ev.preventDefault();
    this._recorder.stop();
    console.debug('stop called:', ev);
  }

  _fireEvent (origEvent) {
    this.dispatchEvent(new AudioRecorderEvent(origEvent));
  }
}

customElements.define('audio-recorder', AudioRecorderElement);
