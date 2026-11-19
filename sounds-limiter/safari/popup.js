const extensionApi = globalThis.browser ?? globalThis.chrome;
const DEFAULT_PREFIXES = [
  "https://glzwizzlv.bynetcdn.com/glglz_mp3",
  "https://27613.live.streamtheworld.com/KAN_GIMMEL.mp3",
  "https://www.youtube.com/watch*"
];
const form = document.querySelector("#add-form");
const input = document.querySelector("#url-prefix");
const maxVolumeInput = document.querySelector("#max-volume");
const maxVolumeValue = document.querySelector("#max-volume-value");
const list = document.querySelector("#url-list");
const status = document.querySelector("#status");

const readPrefixes = async () => {
  const { urlPrefixes } = await extensionApi.storage.local.get("urlPrefixes");
  return Array.isArray(urlPrefixes) ? urlPrefixes : DEFAULT_PREFIXES;
};

const showStatus = (message, isError = false) => {
  status.textContent = message;
  status.dataset.error = String(isError);
};

const renderMaxVolume = (value) => {
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(1, value)) : 2;
  maxVolumeInput.value = String(percent);
  maxVolumeValue.value = `${percent}%`;
  maxVolumeValue.textContent = `${percent}%`;
};

extensionApi.storage.local.get({ maxVolumePercent: 2 }).then(({ maxVolumePercent }) => {
  renderMaxVolume(maxVolumePercent);
}).catch((error) => showStatus(error.message, true));

maxVolumeInput.addEventListener("input", () => {
  renderMaxVolume(Number(maxVolumeInput.value));
});

maxVolumeInput.addEventListener("change", async () => {
  const maxVolumePercent = Number(maxVolumeInput.value);
  try {
    await extensionApi.storage.local.set({ maxVolumePercent });
    showStatus(`Maximum volume set to ${maxVolumePercent}%.`);
  } catch (error) {
    showStatus(error.message, true);
  }
});

const parsePrefix = (value) => {
  const trimmed = value.trim();
  let url;
  try { url = new URL(trimmed); } catch { return null; }
  if (!(["http:", "https:"].includes(url.protocol)) || !url.hostname || url.username || url.password) return null;
  if (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) return null;
  return { prefix: trimmed, originPattern: `${url.origin}/*` };
};

const savePrefixes = async (prefixes) => {
  const response = await extensionApi.runtime.sendMessage({ type: "url-prefixes-updated", urlPrefixes: prefixes });
  if (!response?.ok) throw new Error(response?.error || "Could not update the URL list.");
  await render();
};

const render = async () => {
  const prefixes = await readPrefixes();
  list.replaceChildren();
  if (!prefixes.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No URLs added yet.";
    list.append(empty);
    return;
  }

  for (const prefix of prefixes) {
    const parsed = parsePrefix(prefix);
    if (!parsed) continue;
    const item = document.createElement("li");
    item.className = "url-item";
    const label = document.createElement("span");
    label.className = "url-label";
    label.textContent = prefix;
    const actions = document.createElement("div");
    actions.className = "url-actions";
    const hasPermission = await extensionApi.permissions.contains({ origins: [parsed.originPattern] });
    if (!hasPermission) {
      const enable = document.createElement("button");
      enable.type = "button";
      enable.textContent = "Enable";
      enable.addEventListener("click", async () => {
        try {
          const granted = await extensionApi.permissions.request({ origins: [parsed.originPattern] });
          if (granted) {
            const response = await extensionApi.runtime.sendMessage({ type: "sync-content-scripts" });
            if (!response?.ok) throw new Error(response?.error || "Could not enable this URL.");
          }
          showStatus(granted ? "Access granted." : "Site access was not granted.", !granted);
          await render();
        } catch (error) { showStatus(error.message, true); }
      });
      actions.append(enable);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${prefix}`);
    remove.addEventListener("click", async () => {
      try {
        await savePrefixes(prefixes.filter((value) => value !== prefix));
        const remainingOnOrigin = (await readPrefixes()).some((value) => parsePrefix(value)?.originPattern === parsed.originPattern);
        if (!remainingOnOrigin) await extensionApi.permissions.remove({ origins: [parsed.originPattern] });
        showStatus("URL removed.");
      } catch (error) { showStatus(error.message, true); }
    });
    actions.append(remove);
    item.append(label, actions);
    list.append(item);
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const parsed = parsePrefix(input.value);
  if (!parsed) {
    showStatus("Enter a valid http:// or https:// URL without a custom port.", true);
    input.focus();
    return;
  }

  let granted;
  try {
    granted = await extensionApi.permissions.request({ origins: [parsed.originPattern] });
  } catch (error) {
    showStatus(error.message, true);
    return;
  }
  if (!granted) {
    showStatus("Site access was not granted, so the URL was not added.", true);
    return;
  }

  try {
    const prefixes = await readPrefixes();
    if (prefixes.includes(parsed.prefix)) {
      showStatus("That URL prefix is already in the list.", true);
      return;
    }
    await savePrefixes([...prefixes, parsed.prefix]);
    input.value = "";
    showStatus("URL added.");
  } catch (error) { showStatus(error.message, true); }
});

render().catch((error) => showStatus(error.message, true));
