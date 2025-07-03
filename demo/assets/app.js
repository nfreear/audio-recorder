/**
 * Example audio recorder app.
 */

import 'audio-recorder-el';

const wrapperElem = document.querySelector('#wrapper');
const audioElem = document.querySelector('#audio');

wrapperElem.addEventListener('audio-recorder', (event) => {
  const { eventName, mimeType } = event;
  const recorderElem = event.target;

  // When the recording stops, access the audio data.
  if (event.is('stop')) {
    audioElem.src = recorderElem.createAudioURL();
    console.debug('>> Duration:', recorderElem.duration);
  }

  if (event.is('error')) {
    console.error('audio-recorder ERROR:', event.message, event);
  } else {
    console.debug('audio-recorder event:', eventName, mimeType, event);
  }

  // console.debug('Constructors:', ev.constructor.name, ev.target.constructor.name);
});
