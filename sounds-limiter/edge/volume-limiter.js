(() => {
  "use strict";

  if (globalThis.__urlVolumeLimiterInitialized) return;
  globalThis.__urlVolumeLimiterInitialized = true;

  const publishConfig = async () => {
    const {
      urlPrefixes: savedPrefixes = [],
      maxVolumePercent: savedMaxVolumePercent = 2
    } = await chrome.storage.local.get(["urlPrefixes", "maxVolumePercent"]);
    const config = {
      urlPrefixes: savedPrefixes,
      maxVolumePercent: Number.isFinite(savedMaxVolumePercent)
      ? Math.min(100, Math.max(1, savedMaxVolumePercent))
      : 2
    };
    window.postMessage({ type: "url-volume-limiter-config", config }, location.origin);
  };

  window.addEventListener("message", (event) => {
    if (event.origin === location.origin && event.data?.type === "url-volume-limiter-request-config") {
      publishConfig().catch(() => {});
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.urlPrefixes || changes.maxVolumePercent) publishConfig().catch(() => {});
  });

  publishConfig().catch(() => {});
})();
