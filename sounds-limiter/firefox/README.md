# URL Volume Limiter for Firefox

Use the toolbar popup to choose a maximum media volume from 1% to 100% (2% by default), then add or remove URL prefixes. Firefox asks for permission to access each site's origin when you add a prefix. The GLGLZ and KAN Gimmel stream prefixes, along with `https://www.youtube.com/watch*`, are included by default.

Settings stay in Firefox local extension storage. The limiter applies to audio and video elements whose source starts with a saved prefix, and to media on matching pages when the source is a blob URL. It cannot change the volume of Firefox's built-in standalone media viewer or audio rendered outside page media elements.

## Install temporarily for development

1. Open `about:debugging` in Firefox.
2. Choose **This Firefox**.
3. Click **Load Temporary Add-on…** and select `manifest.json` in this folder.
4. Open the extension popup to manage the volume cap and URL prefixes.

Temporary add-ons are removed when Firefox closes.

## Build an add-on package

Install Mozilla's `web-ext` tool, then run from this directory:

```sh
web-ext build
```

The generated package in `web-ext-artifacts/` can be submitted to addons.mozilla.org for signing. Firefox release and beta require signed add-ons.

The manifest requires Firefox 128 or later for optional host permissions and main-world script support.

## Run unit tests

Run `node --test tests/firefox-extension.test.mjs`. The tests use Node's built-in test runner and require no additional packages.
