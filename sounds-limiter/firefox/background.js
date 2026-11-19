const DEFAULT_PREFIXES = [
  "https://glzwizzlv.bynetcdn.com/glglz_mp3",
  "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3",
  "https://www.youtube.com/watch*"
];
const DEFAULTS_MIGRATION_VERSION_KEY = "defaultUrlPrefixesMigrationVersion";
const DEFAULTS_MIGRATION_VERSION = 2;
const SCRIPT_ID_PREFIX = "url-volume-limiter-";

const hashPrefix = async (prefix) => {
  const bytes = new TextEncoder().encode(prefix);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return SCRIPT_ID_PREFIX + Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const getMatchPattern = (prefix) => {
  const url = new URL(prefix);
  const pathPattern = url.pathname.endsWith("*") ? url.pathname : `${url.pathname}*`;
  return `${url.protocol}//${url.host}${pathPattern}`;
};

const syncContentScripts = async () => {
  const registered = await browser.scripting.getRegisteredContentScripts();
  const ownedIds = registered.filter((script) => script.id.startsWith(SCRIPT_ID_PREFIX)).map((script) => script.id);
  if (ownedIds.length) await browser.scripting.unregisterContentScripts({ ids: ownedIds });

  const { urlPrefixes = [] } = await browser.storage.local.get("urlPrefixes");
  for (const prefix of urlPrefixes) {
    const url = new URL(prefix);
    const originPattern = `${url.origin}/*`;
    const hasPermission = await browser.permissions.contains({ origins: [originPattern] });
    if (!hasPermission) continue;

    const match = [getMatchPattern(prefix)];
    const scriptId = await hashPrefix(prefix);
    await browser.scripting.registerContentScripts([
      {
        id: `${scriptId}-bridge`,
        matches: match,
        js: ["volume-limiter.js"],
        runAt: "document_start",
        allFrames: true,
        world: "ISOLATED"
      },
      {
        id: `${scriptId}-main`,
        matches: match,
        js: ["volume-limiter-main.js"],
        runAt: "document_start",
        allFrames: true,
        world: "MAIN"
      }
    ]);
  }
};

const injectIntoMatchingTabs = async (prefixes) => {
  for (const prefix of prefixes) {
    const matchingTabs = await browser.tabs.query({ url: getMatchPattern(prefix) });
    for (const tab of matchingTabs) {
      if (tab.id === undefined) continue;
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ["volume-limiter-main.js"],
          world: "MAIN"
        });
        await browser.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ["volume-limiter.js"],
          world: "ISOLATED"
        });
      } catch {
        // Restricted tabs may reject script injection; matching future pages still use the registration.
      }
    }
  }
};

browser.runtime.onInstalled.addListener(() => {
  return initialize().catch(() => {});
});

const initialize = async () => {
  const {
    urlPrefixes,
    [DEFAULTS_MIGRATION_VERSION_KEY]: migrationVersion = 0
  } = await browser.storage.local.get(["urlPrefixes", DEFAULTS_MIGRATION_VERSION_KEY]);
  if (migrationVersion < DEFAULTS_MIGRATION_VERSION) {
    const prefixes = Array.isArray(urlPrefixes) ? urlPrefixes : [];
    const updatedPrefixes = [...prefixes];
    for (const prefix of DEFAULT_PREFIXES) {
      if (!updatedPrefixes.includes(prefix)) updatedPrefixes.push(prefix);
    }
    await browser.storage.local.set({
      urlPrefixes: updatedPrefixes,
      [DEFAULTS_MIGRATION_VERSION_KEY]: DEFAULTS_MIGRATION_VERSION
    });
  }
  await syncContentScripts();
};

browser.runtime.onStartup.addListener(() => {
  syncContentScripts().catch(() => {});
});

browser.runtime.onMessage.addListener(async (message) => {
  if (message?.type === "sync-content-scripts") {
    try {
      await syncContentScripts();
      const { urlPrefixes = [] } = await browser.storage.local.get("urlPrefixes");
      await injectIntoMatchingTabs(urlPrefixes);
      return { ok: true };
    } catch (error) { return { ok: false, error: error.message }; }
  }
  if (message?.type !== "url-prefixes-updated" || !Array.isArray(message.urlPrefixes)) return undefined;

  try {
    const { urlPrefixes: previousPrefixes = [] } = await browser.storage.local.get("urlPrefixes");
    await browser.storage.local.set({ urlPrefixes: message.urlPrefixes });
    await syncContentScripts();
    const addedPrefixes = message.urlPrefixes.filter((prefix) => !previousPrefixes.includes(prefix));
    await injectIntoMatchingTabs(addedPrefixes);
    return { ok: true };
  } catch (error) { return { ok: false, error: error.message }; }
});
