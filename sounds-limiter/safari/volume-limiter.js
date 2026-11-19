(() => {
  "use strict";

  const extensionApi = globalThis.browser ?? globalThis.chrome;
  if (!extensionApi?.runtime?.getURL || !extensionApi?.storage?.local) return;

  const publishConfig = async () => {
    const {
      urlPrefixes: savedPrefixes = [],
      maxVolumePercent: savedMaxVolumePercent = 2
    } = await extensionApi.storage.local.get(["urlPrefixes", "maxVolumePercent"]);
    const value = Number(savedMaxVolumePercent);
    const config = {
      urlPrefixes: Array.isArray(savedPrefixes) ? savedPrefixes : [],
      maxVolumePercent: Number.isFinite(value) ? Math.min(100, Math.max(1, value)) : 2
    };
    window.postMessage({ type: "url-volume-limiter-config", config }, location.origin);
  };

  window.addEventListener("message", (event) => {
    if (event.origin === location.origin && event.data?.type === "url-volume-limiter-request-config") {
      publishConfig().catch(() => {});
    }
  });

  extensionApi.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.urlPrefixes || changes.maxVolumePercent) publishConfig().catch(() => {});
  });

  const injectPageScript = () => {
    const root = document.documentElement;
    if (!root) return false;

    const script = document.createElement("script");
    script.src = extensionApi.runtime.getURL("volume-limiter-main.js");
    script.onload = () => script.remove();
    (document.head || root).appendChild(script);
    publishConfig().catch(() => {});
    return true;
  };

  if (!injectPageScript()) {
    const observer = new MutationObserver(() => {
      if (injectPageScript()) observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  }
})();
