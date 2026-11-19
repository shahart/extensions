const extensionApi = globalThis.browser ?? globalThis.chrome;
const DEFAULT_PREFIXES = [
  "https://glzwizzlv.bynetcdn.com/glglz_mp3",
  "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3",
  "https://www.youtube.com/watch*"
];
const MIGRATION_KEY = "defaultUrlPrefixesMigrationVersion";
const MIGRATION_VERSION = 2;
const SCRIPT_ID_PREFIX = "url-volume-limiter-";

const getMatchPattern = (prefix) => {
  const url = new URL(prefix);
  const pathPattern = url.pathname.endsWith("*") ? url.pathname : `${url.pathname}*`;
  return `${url.protocol}//${url.host}${pathPattern}`;
};

const syncContentScripts = async () => {
  const registered = await extensionApi.scripting.getRegisteredContentScripts();
  const ownedIds = registered.filter((script) => script.id.startsWith(SCRIPT_ID_PREFIX)).map((script) => script.id);
  if (ownedIds.length) await extensionApi.scripting.unregisterContentScripts({ ids: ownedIds });

  const { urlPrefixes = [] } = await extensionApi.storage.local.get("urlPrefixes");
  for (const [index, prefix] of urlPrefixes.entries()) {
    let match;
    try { match = getMatchPattern(prefix); } catch { continue; }
    const url = new URL(prefix);
    if (!await extensionApi.permissions.contains({ origins: [`${url.origin}/*`] })) continue;
    await extensionApi.scripting.registerContentScripts([{
      id: `${SCRIPT_ID_PREFIX}${index}`,
      matches: [match],
      js: ["volume-limiter.js"],
      runAt: "document_start",
      allFrames: true,
      persistAcrossSessions: true
    }]);
  }
};

const injectIntoMatchingTabs = async (prefixes) => {
  if (!extensionApi.tabs?.query) return;
  for (const prefix of prefixes) {
    let matchingTabs;
    try { matchingTabs = await extensionApi.tabs.query({ url: getMatchPattern(prefix) }); } catch { continue; }
    for (const tab of matchingTabs) {
      if (tab.id === undefined) continue;
      try {
        await extensionApi.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ["volume-limiter.js"]
        });
      } catch { /* Restricted or already closed tabs can be handled on their next navigation. */ }
    }
  }
};

const initialize = async () => {
  const { urlPrefixes, [MIGRATION_KEY]: migrationVersion = 0 } =
    await extensionApi.storage.local.get(["urlPrefixes", MIGRATION_KEY]);
  if (migrationVersion < MIGRATION_VERSION) {
    const updatedPrefixes = Array.isArray(urlPrefixes) ? [...urlPrefixes] : [];
    for (const prefix of DEFAULT_PREFIXES) if (!updatedPrefixes.includes(prefix)) updatedPrefixes.push(prefix);
    await extensionApi.storage.local.set({ urlPrefixes: updatedPrefixes, [MIGRATION_KEY]: MIGRATION_VERSION });
  }
  await syncContentScripts();
};

extensionApi.runtime.onInstalled.addListener(() => initialize().catch(() => {}));
extensionApi.runtime.onStartup?.addListener(() => syncContentScripts().catch(() => {}));

extensionApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "sync-content-scripts") {
    (async () => {
      await syncContentScripts();
      const { urlPrefixes = [] } = await extensionApi.storage.local.get("urlPrefixes");
      await injectIntoMatchingTabs(urlPrefixes);
      sendResponse({ ok: true });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type !== "url-prefixes-updated" || !Array.isArray(message.urlPrefixes)) return;
  (async () => {
    const { urlPrefixes: previousPrefixes = [] } = await extensionApi.storage.local.get("urlPrefixes");
    await extensionApi.storage.local.set({ urlPrefixes: message.urlPrefixes });
    await syncContentScripts();
    await injectIntoMatchingTabs(message.urlPrefixes.filter((prefix) => !previousPrefixes.includes(prefix)));
    sendResponse({ ok: true });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
