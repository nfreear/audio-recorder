import MyMinElement from 'ndf-elements/base';
import { AudioRecorderEvent } from '../index.js';

const { Blob, customElements, MediaRecorder, navigator } = window;

/**
 * @copyright © Nick Freear, June-2025.
 * @customElement audio-recorder
 */
export class AudioRecorderElement extends MyMinElement {
  #priv = {
    chunks: [], duration: null, startTime: null, recorder: null
  };

  /* constructor () { super(); } */

  get audioBlob () { return this.#priv.audioBlob; }
  get blobSize () { return this.audioBlob.size; }
  get duration () { return this.#priv.duration; }

  get #htmlTemplate () {
    return `
<template>
  <form>
    <audio controls part="audio"></audio>
    <p part="p row">
      <button name="startButton" part="button startButton" data-text="Record"><x part="label">Record</x></button>
      <button name="stopButton" part="button stopButton" disabled data-text="Stop"><x part="label">Stop</x></button>
      <button name="downloadButton" part="button downloadButton" disabled data-text="Download" type="button"><x part="label">Download</x></button>
      <a href="#" id="downloadLink" download="audio" hidden></a>
      <output name="output"></output>
    </p>
  </form>
</template>
`;
  }

  get #elements () { return this.shadowRoot.querySelector('form').elements; }

  connectedCallback () {
    this._attachLocalTemplate(this.#htmlTemplate);

    this.#priv['audioElement'] = this.shadowRoot.querySelector('audio');
    this.#priv['downloadLink'] = this.shadowRoot.querySelector('#downloadLink');

    /* Button event handlers.
    */
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

    this.#priv.recorder = new MediaRecorder(stream);

    this.#priv.recorder.addEventListener('dataavailable', (dataEvent) => {
      this.#priv.chunks.push(dataEvent.data);
      this.#fireEvent(dataEvent);
    });

    this.#priv.recorder.addEventListener('start', (startEvent) => {
      this.#fireEvent(startEvent, 'Recording…');

      this.#priv.startTime = startEvent.timeStamp;
    });

    this.#priv.recorder.addEventListener('stop', (stopEvent) => {
      this.#calculateDuration(stopEvent);

      const type = this.#priv.recorder.mimeType;

      this.#priv.audioBlob = new Blob(this.#priv.chunks, { type });
      this.#priv.audioElement.src = this.createAudioURL();

      this.#fireEvent(stopEvent, `Recording stopped (${this.duration}s)`);

      this.#elements.downloadButton.disabled = false;
      this.#elements.startButton.disabled = false;
      this.#elements.stopButton.disabled = true;
    });

    this.#elements.startButton.disabled = true;
    this.#elements.stopButton.disabled = false;
    this.#elements.stopButton.focus();

    this.#priv.recorder.start();
    this.#fireEvent({
      audioTracks,
      audioDevice: audioTracks[0].label,
      target: this.#priv.recorder,
      type: 'starting'
    },
    'Recording');
  }

  #errorHandler (error) {
    this.#fireEvent({ error, type: 'error', target: this.#priv.recorder }, `Error: ${error.message}`);
    console.warn('Audio Recorder Error:', error);
  }

  createAudioURL () {
    return window.URL.createObjectURL(this.audioBlob);
  }

  #calculateDuration (stopEvent) {
    const milliseconds = parseInt(stopEvent.timeStamp - this.#priv.startTime);
    this.#priv.duration = milliseconds / 1000;
    this.#priv.startTime = null;
  }

  #onStartClick (ev) {
    ev.preventDefault();
    this.#getUserMedia()
      .then((stream) => this.#streamHandler(stream))
      .catch((error) => this.#errorHandler(error));
  }

  #onStopClick (ev) {
    ev.preventDefault();
    this.#priv.recorder.stop();
  }

  #onDownloadClick (ev) {
    ev.preventDefault();
    const blobUrl = this.createAudioURL();
    const size = this.blobSize;
    this.#priv.downloadLink.href = blobUrl;
    this.#priv.downloadLink.click();
    this.#fireEvent({ type: 'download', blobUrl, size, target: this.#priv.recorder }, 'Downloading…');
  }

  /**
   * @fires audio-recorder
   */
  #fireEvent (origEvent, message = null) {
    const event = new AudioRecorderEvent(origEvent);
    if (event.is('error')) {
      this.dataset.error = event.error.name;
    }
    this.dataset.state = event.eventName;
    this.#elements.output.setAttribute('part', `output o-${event.eventName}`);
    this.#elements.output.value = message || event.message || event.eventName;
    this.dispatchEvent(event);
  }
}

customElements.define('audio-recorder', AudioRecorderElement);
