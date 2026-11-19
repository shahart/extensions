import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import test from "node:test";
import vm from "node:vm";

const serviceWorker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

test("registers the requested YouTube watch wildcard without appending a duplicate wildcard", async () => {
  const prefixes = [
    "https://www.youtube.com/watch*",
    "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3"
  ];
  let messageListener;
  const registeredScripts = [];
  let storedPrefixes = [];
  const chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },
      onMessage: { addListener(listener) { messageListener = listener; } }
    },
    storage: {
      local: {
        async get(key) {
          const requestedKeys = Array.isArray(key) ? key : [key];
          return Object.fromEntries(requestedKeys.map((name) => [
            name,
            name === "urlPrefixes" ? storedPrefixes : undefined
          ]));
        },
        async set(values) {
          if (Array.isArray(values.urlPrefixes)) storedPrefixes = values.urlPrefixes;
        }
      }
    },
    permissions: { async contains() { return true; } },
    scripting: {
      async getRegisteredContentScripts() { return []; },
      async registerContentScripts(scripts) { registeredScripts.push(...scripts); },
      async unregisterContentScripts() {}
    },
    tabs: { async query() { return []; } }
  };

  vm.runInContext(serviceWorker, vm.createContext({ chrome, URL, TextEncoder, crypto: webcrypto }));

  const response = await new Promise((resolve) => {
    messageListener({ type: "url-prefixes-updated", urlPrefixes: prefixes }, {}, resolve);
  });

  assert.equal(response.ok, true);
  assert.equal(registeredScripts.length, 4);
  assert.deepEqual(Array.from(registeredScripts[0].matches), ["https://www.youtube.com/watch*"]);
  assert.deepEqual(Array.from(registeredScripts[1].matches), ["https://www.youtube.com/watch*"]);
  assert.deepEqual(Array.from(registeredScripts[2].matches), ["https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3*"]);
  assert.deepEqual(Array.from(registeredScripts[3].matches), ["https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3*"]);
  assert.deepEqual(Array.from(registeredScripts[0].js), ["volume-limiter.js"]);
  assert.deepEqual(Array.from(registeredScripts[1].js), ["volume-limiter-main.js"]);
  assert.deepEqual(Array.from(registeredScripts[2].js), ["volume-limiter.js"]);
  assert.deepEqual(Array.from(registeredScripts[3].js), ["volume-limiter-main.js"]);
  assert.equal(registeredScripts[0].world, "ISOLATED");
  assert.equal(registeredScripts[1].world, "MAIN");
  assert.equal(registeredScripts[2].world, "ISOLATED");
  assert.equal(registeredScripts[3].world, "MAIN");
});

test("adds the KAN Gimmel stream to the default URL list for a fresh install", async () => {
  let installListener;
  const storedValues = {};
  const registeredScripts = [];
  const chrome = {
    runtime: {
      onInstalled: { addListener(listener) { installListener = listener; } },
      onStartup: { addListener() {} },
      onMessage: { addListener() {} }
    },
    storage: {
      local: {
        async get(keys) {
          const requestedKeys = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(requestedKeys.map((key) => [key, storedValues[key]]));
        },
        async set(values) { Object.assign(storedValues, values); }
      }
    },
    permissions: { async contains() { return true; } },
    scripting: {
      async getRegisteredContentScripts() { return []; },
      async registerContentScripts(scripts) { registeredScripts.push(...scripts); },
      async unregisterContentScripts() {}
    },
    tabs: { async query() { return []; } }
  };

  vm.runInContext(serviceWorker, vm.createContext({ chrome, URL, TextEncoder, crypto: webcrypto }));
  await installListener();

  assert.deepEqual(Array.from(storedValues.urlPrefixes), [
    "https://glzwizzlv.bynetcdn.com/glglz_mp3",
    "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3",
    "https://www.youtube.com/watch*"
  ]);
  assert.equal(storedValues.defaultUrlPrefixesMigrationVersion, 2);
  assert.equal(registeredScripts.length, 6);
  assert.deepEqual(Array.from(registeredScripts[2].matches), ["https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3*"]);
  assert.deepEqual(Array.from(registeredScripts[3].matches), ["https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3*"]);
  assert.deepEqual(Array.from(registeredScripts[4].matches), ["https://www.youtube.com/watch*"]);
  assert.deepEqual(Array.from(registeredScripts[5].matches), ["https://www.youtube.com/watch*"]);

  // Simulate an existing v1.3.0 install that already migrated the GLGLZ and KAN defaults.
  registeredScripts.length = 0;
  storedValues.urlPrefixes = [
    "https://glzwizzlv.bynetcdn.com/glglz_mp3",
    "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3"
  ];
  storedValues.defaultUrlPrefixesMigrationVersion = 1;
  await installListener();

  assert.deepEqual(Array.from(storedValues.urlPrefixes), [
    "https://glzwizzlv.bynetcdn.com/glglz_mp3",
    "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3",
    "https://www.youtube.com/watch*"
  ]);
  assert.equal(storedValues.defaultUrlPrefixesMigrationVersion, 2);
  assert.equal(registeredScripts.length, 6);
});
