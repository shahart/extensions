(() => {
  "use strict";

  const extensionApi = globalThis.browser ?? globalThis.chrome;
  if (!extensionApi?.runtime?.getURL) return;

  const injectPageScript = () => {
    const root = document.documentElement;
    if (!root) return false;

    const script = document.createElement("script");
    script.src = extensionApi.runtime.getURL("volume-limiter-main.js");
    script.onload = () => script.remove();
    (document.head || root).appendChild(script);
    return true;
  };

  if (!injectPageScript()) {
    const observer = new MutationObserver(() => {
      if (injectPageScript()) observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  }
})();
