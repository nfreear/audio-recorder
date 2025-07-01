const { Event } = window;

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
  get eventName () { return this.origEvent.type; }
  is (eventName) { return this.eventName === eventName; }
}
