
# `<audio-recorder>` #

[![Node.js][ci-badge]][ci]
[![NPM version][npm-badge]][npm]
[![Published on webcomponents.org][wc-badge]][wc]

An `<audio-recorder>` custom element to simplify recording sound in the browser.

* Demo: [nfreear.github.io/audio-recorder/demo][ghp]

The `<audio-recorder>` element encapsulates a user-interface comprising:
* A _Record_ button,
* _Stop_ button,
* _Download_ button,
* An `<output>` status element (live-region),
* An `<audio>` element for optional playback.

Any of the UI elements above can be hidden, and [styled](#style).

![Screenshot of the audio-recorder user interface][image-1]

## Usage

Install locally:
```sh
npm i audio-recorder-el
```
Or access via CDN:
```js
import 'https://unpkg.com/audio-recorder-el';
```

HTML:
```html
<audio controls></audio>
<audio-recorder features="download"></audio-recorder>
```

This is a JavaScript example of listening for the `audio-recorder` event emitted by the custom element ([complete demo][demo-js]):
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

## Style

Use the `features` attribute and the [stylesheet][] to enable features in the user-interface:

* `features="featA featB …"` - Add multiple features separated by a space,
* `features="download"` - Add a download button,
* `features="playback"` - Add a HTML `<audio>` element with controls, for immediate playback,
* `features="icon"` - Use icons for the buttons, as opposed to visible text,
* `features="tip"` - Use experimental tooltips on focus and hover.

Individual elements in the UI are exposed using `::part()`, for example, `::part(button)`.

[ci]: https://github.com/nfreear/audio-recorder/actions/workflows/node.js.yml
[ci-badge]: https://github.com/nfreear/audio-recorder/actions/workflows/node.js.yml/badge.svg
[npm]: https://www.npmjs.com/package/audio-recorder-el
[npm-badge]: https://img.shields.io/npm/v/audio-recorder-el
[wc]: https://www.webcomponents.org/element/audio-recorder-el
[wc-badge]: https://img.shields.io/badge/webcomponents.org-published-blue.svg
[source]: https://github.com/nfreear/11labs-demo/issues/1
[image-1]: ./demo/assets/audio-recorder-element-1.png
[stylesheet]: ./src/audio-recorder.css
[styled]: ./src/audio-recorder.css
[demo-js]: ./demo/assets/app.js
[ghp]: https://nfreear.github.io/audio-recorder/demo/
