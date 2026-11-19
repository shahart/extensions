(() => {
  "use strict";

  const URL_PREFIXES = ["https://glzwizzlv.bynetcdn.com/glglz_mp3", "https://www.youtube.com/watch*"];
  const LIMIT = 0.01;
  const mediaPrototype = HTMLMediaElement.prototype;
  const volumeDescriptor = Object.getOwnPropertyDescriptor(mediaPrototype, "volume");

  if (!volumeDescriptor?.get || !volumeDescriptor?.set) return;

  const isLimitedMedia = (media) => {
    if (media == null) return false;
    const source = media.currentSrc || media.src || media.querySelector("source[src]")?.src;
    return Boolean(source); // && URL_PREFIXES.some((prefix) => source.startsWith(prefix)));
  };

  const enforceLimit = (media) => {
    if (isLimitedMedia(media) && volumeDescriptor.get.call(media) > LIMIT) {
      volumeDescriptor.set.call(media, LIMIT);
    }
  };

  Object.defineProperty(mediaPrototype, "volume", {
    ...volumeDescriptor,
    set(value) {
      volumeDescriptor.set.call(this, isLimitedMedia(this) ? Math.min(Number(value), LIMIT) : value);
    }
  });

  // Native player controls may update volume without going through the JS setter.
  document.addEventListener("volumechange", (event) => {
    enforceLimit(event.target);
  }, true);

  const scan = (root = document) => {
    if (root instanceof HTMLMediaElement) enforceLimit(root);
    root.querySelectorAll?.("audio, video").forEach(enforceLimit);
  };

  const observe = (root) => {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes") {
          scan(record.target);
        } else {
          record.addedNodes.forEach((node) => {
            if (node instanceof Element) scan(node);
          });
        }
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src"]
    });
  };

  scan();
  if (document.documentElement) observe(document.documentElement);
  else {
    new MutationObserver(() => {
      if (document.documentElement) {
        scan();
        observe(document.documentElement);
      }
    }).observe(document, { childList: true });
  }
})();
