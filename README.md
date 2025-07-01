
# `<audio-recorder>` #

[![Node.js][ci-badge]][ci]

An `<audio-recorder>` custom element to simplify recording sound in the browser.

```html
<audio controls></audio>
<audio-recorder></audio-recorder>
```

This is an example of listening for the `audio-recorder` event emitted by the custom element:

```js
const audioElem = document.querySelector('audio');

document.body.addEventListener('audio-recorder', (event) => {
  const { eventName } = event;
  const recorder = event.target;

  if (event.is('stop')) {
    audioElem.src = recorder.createAudioURL();
  }

  console.debug('audio-recorder:', eventName, event);
});
```

[ci]: https://github.com/nfreear/audio-recorder/actions/workflows/node.js.yml
[ci-badge]: https://github.com/nfreear/audio-recorder/actions/workflows/node.js.yml/badge.svg
