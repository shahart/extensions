import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const contentScript = await readFile(new URL("../volume-limiter.js", import.meta.url), "utf8");
const mainWorldScript = await readFile(new URL("../volume-limiter-main.js", import.meta.url), "utf8");
const matchingPrefix = "https://media.example.test/audio";

const createLimiter = async ({
  urlPrefixes = [matchingPrefix],
  maxVolumePercent = 50,
  pageUrl = "https://page.example.test/"
} = {}) => {
  class Element {}

  class HTMLMediaElement extends Element {
    constructor(src, initialVolume = 1) {
      super();
      this.src = src;
      this.currentSrc = src;
      this._volume = initialVolume;
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

  const nativeVolume = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume");
  const media = [];
  const listeners = new Map();
  const windowListeners = new Map();
  const storageListeners = [];
  const volumeLogs = [];
  let currentMaxVolumePercent = maxVolumePercent;
  const document = {
    documentElement: {},
    querySelectorAll() {
      return media;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    }
  };

  class MutationObserver {
    observe() {}
  }

  const chrome = {
    storage: {
      local: {
        async get() {
          return { urlPrefixes, maxVolumePercent: currentMaxVolumePercent };
        }
      },
      onChanged: {
        addListener(listener) {
          storageListeners.push(listener);
        }
      }
    }
  };

  const window = {
    addEventListener(type, listener) {
      const listenersForType = windowListeners.get(type) || [];
      listenersForType.push(listener);
      windowListeners.set(type, listenersForType);
    },
    postMessage(data) {
      for (const listener of windowListeners.get("message") || []) {
        listener({ source: window, origin: new URL(pageUrl).origin, data });
      }
    }
  };

  const context = vm.createContext({
    Element,
    HTMLMediaElement,
    MutationObserver,
    chrome,
    document,
    window,
    console: { info(message) { volumeLogs.push(message); } },
    setInterval() { return 1; },
    clearInterval() {},
    location: new URL(pageUrl)
  });
  vm.runInContext(mainWorldScript, context);
  vm.runInContext(contentScript, context);
  await new Promise((resolve) => setImmediate(resolve));

  return {
    addMedia(src, initialVolume = 1) {
      const element = new HTMLMediaElement(src, initialVolume);
      media.push(element);
      return element;
    },
    async changeMaxVolume(percent) {
      currentMaxVolumePercent = percent;
      for (const listener of storageListeners) {
        listener({ maxVolumePercent: { newValue: percent } }, "local");
      }
      await new Promise((resolve) => setImmediate(resolve));
    },
    simulateExternalVolumeChange(element, volume) {
      nativeVolume.set.call(element, volume);
      listeners.get("volumechange")({ target: element });
    },
    volumeLogs
  };
};

test("caps matching media at the configured maximum", async () => {
  const limiter = await createLimiter({ maxVolumePercent: 50 });
  const matchingMedia = limiter.addMedia(`${matchingPrefix}/track.mp3`);

  matchingMedia.volume = 0.9;
  limiter.simulateExternalVolumeChange(matchingMedia, matchingMedia.volume);

  assert.equal(matchingMedia.volume, 0.5);
  assert.deepEqual(limiter.volumeLogs, ["[URL Volume Limiter] Volume changed: 50%"]);
});

test("does not cap media outside the configured URL prefixes", async () => {
  const limiter = await createLimiter({ maxVolumePercent: 50 });
  const otherMedia = limiter.addMedia("https://other.example.test/track.mp3");

  otherMedia.volume = 0.9;
  limiter.simulateExternalVolumeChange(otherMedia, otherMedia.volume);

  assert.equal(otherMedia.volume, 0.9);
  assert.deepEqual(limiter.volumeLogs, []);
});

test("caps blob-backed media when its YouTube watch page matches a wildcard prefix", async () => {
  const limiter = await createLimiter({
    urlPrefixes: ["https://www.youtube.com/watch*"],
    pageUrl: "https://www.youtube.com/watch?v=example",
    maxVolumePercent: 25
  });
  const youtubeMedia = limiter.addMedia("blob:https://www.youtube.com/8e113e3a", 0.9);

  youtubeMedia.volume = 0.8;

  assert.equal(youtubeMedia.volume, 0.25);
});

test("caps and logs the KAN Gimmel stream URL", async () => {
  const streamUrl = "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3";
  const limiter = await createLimiter({
    urlPrefixes: [streamUrl],
    pageUrl: streamUrl,
    maxVolumePercent: 35
  });
  const streamMedia = limiter.addMedia(streamUrl);

  streamMedia.volume = 0.9;
  limiter.simulateExternalVolumeChange(streamMedia, streamMedia.volume);

  assert.equal(streamMedia.volume, 0.35);
  assert.deepEqual(limiter.volumeLogs, ["[URL Volume Limiter] Volume changed: 35%"]);
});

test("applies a changed cap to existing media and later volume changes", async () => {
  const limiter = await createLimiter({ maxVolumePercent: 50 });
  const matchingMedia = limiter.addMedia(`${matchingPrefix}/track.mp3`, 0.8);

  await limiter.changeMaxVolume(30);
  assert.equal(matchingMedia.volume, 0.3);

  limiter.simulateExternalVolumeChange(matchingMedia, 0.9);
  assert.equal(matchingMedia.volume, 0.3);
});
