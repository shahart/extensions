import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const script = await readFile(new URL("../volume-limiter.js", import.meta.url), "utf8");
const LIMIT = 0.01;

const createHarness = async (initialMedia = []) => {
  class Element {
    constructor(children = []) {
      this.children = children;
    }

    querySelectorAll() {
      return this.children;
    }
  }

  class HTMLMediaElement extends Element {
    constructor({ src = "", volume = 1 } = {}) {
      super();
      this.src = src;
      this.currentSrc = src;
      this._volume = volume;
    }

    querySelector() {
      return null;
    }
  }

  Object.defineProperty(HTMLMediaElement.prototype, "volume", {
    configurable: true,
    enumerable: true,
    get() {
      return this._volume;
    },
    set(value) {
      this._volume = Math.min(1, Math.max(0, Number(value)));
    }
  });

  const mediaElements = initialMedia.map((options) =>
    options === undefined ? undefined : new HTMLMediaElement(options)
  );
  const documentRoot = new Element(mediaElements);
  const eventListeners = new Map();
  const document = {
    documentElement: documentRoot,
    querySelectorAll: () => mediaElements,
    addEventListener(type, listener) {
      eventListeners.set(type, listener);
    }
  };
  const observers = [];

  class MutationObserver {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }

    observe() {}
  }

  const nativeVolume = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume");
  const context = vm.createContext({ Element, HTMLMediaElement, MutationObserver, document });
  vm.runInContext(script, context);

  return {
    mediaElements,
    addMedia(options) {
      const media = new HTMLMediaElement(options);
      mediaElements.push(media);
      documentRoot.children = mediaElements;
      return media;
    },
    notifyAdded(node) {
      const observer = observers.find((candidate) => candidate.callback);
      observer.callback([{ type: "childList", addedNodes: [node] }]);
    },
    setVolumeThroughPlayerControl(media, value) {
      nativeVolume.set.call(media, value);
      eventListeners.get("volumechange")({ target: media });
    }
  };
};

test("limits sourced media found during initial page scan", async () => {
  const harness = await createHarness([{ src: "https://media.example.test/audio.mp3", volume: 0.8 }]);
  const [media] = harness.mediaElements;

  assert.equal(media.volume, LIMIT);
});

test("caps later attempts to raise sourced media volume", async () => {
  const harness = await createHarness();
  const media = harness.addMedia({ src: "https://media.example.test/audio.mp3", volume: 0.2 });

  media.volume = 0.8;

  assert.equal(media.volume, LIMIT);
});

test("caps volume changes made through the browser media controls", async () => {
  const harness = await createHarness();
  const media = harness.addMedia({ src: "https://glzwizzlv.bynetcdn.com/glglz_mp3", volume: 0.2 });

  harness.setVolumeThroughPlayerControl(media, 0.8);

  assert.equal(media.volume, LIMIT);
});

test("does not cap media without a source", async () => {
  const harness = await createHarness();
  const media = harness.addMedia({ volume: 0.8 });

  media.volume = 0.6;

  assert.equal(media.volume, 0.6);
});

test("limits sourced media added after the initial scan", async () => {
  const harness = await createHarness();
  const media = harness.addMedia({ src: "https://media.example.test/new.mp3", volume: 0.8 });

  harness.notifyAdded(media);

  assert.equal(media.volume, LIMIT);
});

test("ignores an undefined media entry without throwing", async () => {
  await assert.doesNotReject(() => createHarness([undefined]));
});
