(() => {
  "use strict";

  if (globalThis.__urlVolumeLimiterMainInitialized) return;
  globalThis.__urlVolumeLimiterMainInitialized = true;

  let urlPrefixes = [];
  let maxVolumePercent = 2;
  let configReceived = false;
  const lastLoggedVolume = new WeakMap();
  const mediaPrototype = HTMLMediaElement.prototype;
  const volumeDescriptor = Object.getOwnPropertyDescriptor(mediaPrototype, "volume");
  if (!volumeDescriptor?.get || !volumeDescriptor?.set) return;

  const matchesPrefix = (url) => urlPrefixes.some((prefix) => {
    const wildcardIndex = prefix.indexOf("*");
    return url.startsWith(wildcardIndex === -1 ? prefix : prefix.slice(0, wildcardIndex));
  });

  const isLimited = (media) => {
    const source = media.currentSrc || media.src || media.querySelector("source[src]")?.src;
    return Boolean((source && matchesPrefix(source)) || matchesPrefix(location.href));
  };

  const enforce = (media) => {
    if (isLimited(media) && volumeDescriptor.get.call(media) > maxVolumePercent / 100) {
      volumeDescriptor.set.call(media, maxVolumePercent / 100);
    }
  };

  Object.defineProperty(mediaPrototype, "volume", {
    ...volumeDescriptor,
    set(value) {
      const requested = Number(value);
      volumeDescriptor.set.call(this, isLimited(this) ? Math.min(requested, maxVolumePercent / 100) : value);
    }
  });

  const scan = (root = document) => {
    if (root instanceof HTMLMediaElement) enforce(root);
    root.querySelectorAll?.("audio, video").forEach(enforce);
  };

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.data?.type !== "url-volume-limiter-config") return;
    const config = event.data.config;
    if (!Array.isArray(config?.urlPrefixes)) return;
    urlPrefixes = config.urlPrefixes.filter((prefix) => typeof prefix === "string");
    const value = Number(config.maxVolumePercent);
    maxVolumePercent = Number.isFinite(value) ? Math.min(100, Math.max(1, value)) : 2;
    configReceived = true;
    scan();
  });

  const requestConfig = () => {
    if (!configReceived) window.postMessage({ type: "url-volume-limiter-request-config" }, location.origin);
  };
  let configRequestAttempts = 0;
  requestConfig();
  const configRequestTimer = setInterval(() => {
    if (configReceived || configRequestAttempts >= 200) {
      clearInterval(configRequestTimer);
      return;
    }
    configRequestAttempts += 1;
    requestConfig();
  }, 50);

  document.addEventListener("volumechange", (event) => {
    if (!(event.target instanceof HTMLMediaElement)) return;
    const media = event.target;
    enforce(media);
    if (!isLimited(media)) return;

    const volume = volumeDescriptor.get.call(media);
    if (lastLoggedVolume.get(media) === volume) return;
    lastLoggedVolume.set(media, volume);
    console.info(`[URL Volume Limiter] Volume changed: ${Math.round(volume * 100)}%`);
  }, true);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") scan(record.target);
      else record.addedNodes.forEach((node) => {
        if (node instanceof Element) scan(node);
      });
    }
  });

  const observeDocument = () => {
    if (!document.documentElement) return false;
    scan();
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src"]
    });
    return true;
  };

  if (!observeDocument()) {
    observer.observe(document, { childList: true });
    observer.takeRecords();
    document.addEventListener("DOMContentLoaded", observeDocument, { once: true });
  }
})();
