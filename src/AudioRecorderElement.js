import MyMinElement from 'MyMinElement';

const { Blob, customElements, Event, MediaRecorder, navigator } = window;

/**
 * @copyright © Nick Freear, June-2025.
 */
export class AudioRecorderEvent extends Event {
  #origEvent;

  constructor (origEvent) {
    super('audio-recorder', { bubbles: true });
    // Was: super(`audio-recorder:${origEvent.type}`, { bubbles: true });
    this.#origEvent = origEvent;
  }

  get origEvent () { return this.#origEvent; }
  get origTarget () { return this.origEvent.target || {}; }
  get audioBitsPerSecond () { return this.origTarget.audioBitsPerSecond; }
  get mimeType () { return this.origTarget.mimeType || null; }
  get error () { return this.origEvent.error; }
  get message () { return this.origEvent.error ? this.origEvent.error.message : null; }
  get eventName () { return this.origEvent.type; } // : this._type; }
  is (eventName) { return this.eventName === eventName; }
}

/**
 * @copyright © Nick Freear, June-2025.
 * @customElement audio-recorder
 */
export class AudioRecorderElement extends MyMinElement {
  #audioBlob;
  #chunks = [];
  #duration = null;
  #startTime = null;
  #recorder;

  /* constructor () { super(); } */

  get audioBlob () { return this.#audioBlob; }
  get blobSize () { return this.audioBlob.size; }
  get duration () { return this.#duration; }

  get #template () {
    return `
<template>
  <form>
    <audio controls part="audio"></audio>
    <p part="row">
      <button name="startButton" part="button">Record</button>
      <button name="stopButton" part="button" disabled>Stop</button>
      <button name="downloadButton" part="button" disabled>Download</button>
      <a href="#" id="downloadLink" download="example" hidden></a>
      <output name="output"></output>
    </p>
  </form>
</template>
`;
  }

  get #elements () { return this.shadowRoot.querySelector('form').elements; }
  get #audioElement () { return this.shadowRoot.querySelector('audio'); }
  get #downloadLink () { return this.shadowRoot.querySelector('#downloadLink'); }

  connectedCallback () {
    this._attachLocalTemplate(this.#template);

    this.#elements.startButton.addEventListener('click', (ev) => this.#onStartClick(ev));
    this.#elements.stopButton.addEventListener('click', (ev) => this.#onStopClick(ev));
    this.#elements.downloadButton.addEventListener('click', (ev) => this.#onDownloadClick(ev));

    console.debug('audio-recorder:', [this]);
  }

  #getUserMedia () {
    const constraints = { audio: true, video: false };
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  #streamHandler (stream) {
    const audioTracks = stream.getAudioTracks();

    // console.debug(`Using audio device: ${audioTracks[0].label}`);

    stream.onremovetrack = () => {
      console.debug('Stream ended');
    };

    this.#recorder = new MediaRecorder(stream);

    this.#recorder.addEventListener('dataavailable', (dataEvent) => {
      this.#chunks.push(dataEvent.data);
      this.#fireEvent(dataEvent);
    });

    this.#recorder.addEventListener('start', (startEvent) => {
      this.#fireEvent(startEvent, 'Recording…');

      this.#startTime = startEvent.timeStamp;
    });

    this.#recorder.addEventListener('stop', (stopEvent) => {
      this.#calculateDuration(stopEvent);

      const type = this.#recorder.mimeType;

      this.#audioBlob = new Blob(this.#chunks, { type });
      this.#audioElement.src = this.createAudioURL();

      this.#fireEvent(stopEvent, `Recording stopped (${this.duration})`);

      this.#elements.downloadButton.disabled = false;
      this.#elements.startButton.disabled = false;
      this.#elements.stopButton.disabled = true;
    });

    this.#elements.startButton.disabled = true;
    this.#elements.stopButton.disabled = false;

    this.#recorder.start();
    this.#fireEvent({
      audioTracks,
      audioDevice: audioTracks[0].label,
      target: this.#recorder,
      type: 'starting'
    },
    'Recording');
  }

  #errorHandler (error) {
    this.#fireEvent({ error, type: 'error', target: this.#recorder }, `Error: ${error.message}`);
    console.warn('Audio Recorder Error:', error);
  }

  createAudioURL () {
    return window.URL.createObjectURL(this.audioBlob);
  }

  #calculateDuration (stopEvent) {
    const milliseconds = parseInt(stopEvent.timeStamp - this.#startTime);
    this.#duration = milliseconds / 1000;
    this.#startTime = null;
  }

  #onStartClick (ev) {
    ev.preventDefault();
    this.#getUserMedia()
      .then((stream) => this.#streamHandler(stream))
      .catch((error) => this.#errorHandler(error));
  }

  #onStopClick (ev) {
    ev.preventDefault();
    this.#recorder.stop();
  }

  #onDownloadClick (ev) {
    ev.preventDefault();
    const blobUrl = this.createAudioURL();
    const size = this.blobSize;
    this.#downloadLink.href = blobUrl;
    this.#downloadLink.click();
    this.#fireEvent({ type: 'download', blobUrl, size, target: this.#recorder });
  }

  #fireEvent (origEvent, message = null) {
    const event = new AudioRecorderEvent(origEvent);
    if (event.is('error')) {
      this.dataset.error = event.error.name;
    }
    this.dataset.state = event.eventName;
    this.#elements.output.setAttribute('part', `output ${event.eventName}`);
    this.#elements.output.value = message || event.message || event.eventName;
    this.dispatchEvent(event);
  }
}

customElements.define('audio-recorder', AudioRecorderElement);
