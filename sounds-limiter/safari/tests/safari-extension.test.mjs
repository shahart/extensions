import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const script = await readFile(new URL("../volume-limiter-main.js", import.meta.url), "utf8");
const LIMIT = 0.01;

const createHarness = (initialMedia = []) => {
  class Element {
    constructor(children = []) { this.children = children; }
    querySelectorAll() { return this.children; }
  }

  class HTMLMediaElement extends Element {
    constructor({ src = "", volume = 1 } = {}) {
      super();
      this.src = src;
      this.currentSrc = src;
      this._volume = volume;
    }
    querySelector() { return null; }
  }

  Object.defineProperty(HTMLMediaElement.prototype, "volume", {
    configurable: true,
    get() { return this._volume; },
    set(value) { this._volume = Math.min(1, Math.max(0, Number(value))); }
  });

  const mediaElements = initialMedia.map((options) =>
    options === undefined ? undefined : new HTMLMediaElement(options)
  );
  const documentRoot = new Element(mediaElements);
  const eventListeners = new Map();
  const document = {
    documentElement: documentRoot,
    querySelectorAll: () => mediaElements,
    addEventListener(type, listener) { eventListeners.set(type, listener); }
  };
  const observers = [];
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
  }

  const nativeVolume = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume");
  vm.runInContext(script, vm.createContext({ Element, HTMLMediaElement, MutationObserver, document }));

  return {
    mediaElements,
    addMedia(options) {
      const media = new HTMLMediaElement(options);
      mediaElements.push(media);
      documentRoot.children = mediaElements;
      return media;
    },
    notifyAdded(node) {
      observers[0].callback([{ type: "childList", addedNodes: [node] }]);
    },
    setVolumeThroughPlayerControl(media, value) {
      nativeVolume.set.call(media, value);
      eventListeners.get("volumechange")?.({ target: media });
    }
  };
};

test("limits sourced media found during initial page scan", () => {
  const { mediaElements: [media] } = createHarness([{ src: "https://media.example.test/audio.mp3", volume: 0.8 }]);
  assert.equal(media.volume, LIMIT);
});

test("caps later attempts to raise sourced media volume", () => {
  const media = createHarness().addMedia({ src: "https://media.example.test/audio.mp3", volume: 0.2 });
  media.volume = 0.8;
  assert.equal(media.volume, LIMIT);
});

test("caps volume changes made through native player controls", () => {
  const harness = createHarness();
  const media = harness.addMedia({ src: "https://media.example.test/audio.mp3", volume: 0.2 });
  harness.setVolumeThroughPlayerControl(media, 0.8);
  assert.equal(media.volume, LIMIT);
});

test("limits sourced media added after the initial scan", () => {
  const harness = createHarness();
  const media = harness.addMedia({ src: "https://media.example.test/new.mp3", volume: 0.8 });
  harness.notifyAdded(media);
  assert.equal(media.volume, LIMIT);
});

test("ignores a missing media entry without throwing", () => {
  assert.doesNotThrow(() => createHarness([undefined]));
});

test("Safari bootstrap loads the page-world limiter from the extension bundle", async () => {
  const bootstrap = await readFile(new URL("../volume-limiter.js", import.meta.url), "utf8");
  const inserted = [];
  const root = {
    appendChild(script) { inserted.push(script); },
  };
  const document = {
    documentElement: root,
    head: root,
    createElement: () => ({ remove() {} }),
  };
  const browser = { runtime: { getURL: (path) => `safari-web-extension://id/${path}` } };

  vm.runInContext(bootstrap, vm.createContext({ document, browser }));

  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].src, "safari-web-extension://id/volume-limiter-main.js");
});

test("Safari manifest exposes the page script on both YouTube host forms", async () => {
  const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));
  const contentScript = manifest.content_scripts[0];
  const pageResources = manifest.web_accessible_resources[0];

  assert.ok(contentScript.matches.includes("https://youtube.com/watch*"));
  assert.ok(contentScript.matches.includes("https://www.youtube.com/watch*"));
  assert.ok(pageResources.resources.includes("volume-limiter-main.js"));
  assert.deepEqual(pageResources.matches, contentScript.matches);
});
