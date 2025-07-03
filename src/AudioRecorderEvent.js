const { Event } = window;

/**
 * A bubbling event named after the <audio-recorder> custom element, and constructed from an original event.
 *
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
  get message () { return this.error ? this.error.message : null; }
  /**
   * @property {string} eventName - the 'type' of the original event, for example "start", "stop" or "error".
   */
  get eventName () { return this.origEvent.type; }
  /**
   * Utility method to filter on the 'type' of the original event.
   */
  is (eventName) { return this.eventName === eventName; }
  not (eventName) { return this.eventName !== eventName; }
}
