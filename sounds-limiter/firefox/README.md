# URL Volume Limiter for Firefox

Firefox extension source, using the same volume-limiting script and page matches as the Chrome version. The script runs in the page's main JavaScript world so it can intercept `HTMLMediaElement.volume` writes from the page.

## Install temporarily for development

1. Open `about:debugging` in Firefox.
2. Choose **This Firefox**.
3. Click **Load Temporary Add-on…** and select `manifest.json` in this folder.
4. Reload a matching page.

Temporary add-ons are removed when Firefox closes.

## Build an add-on package

Install Mozilla's `web-ext` tool, then run from this directory:

```sh
web-ext build
```

The generated `.zip` in `web-ext-artifacts/` can be submitted to addons.mozilla.org for signing. Firefox release and beta require signed add-ons; temporary installation is suitable for local development.

The manifest requires Firefox 128 or later because it uses `world: "MAIN"` for static content scripts.

## Run unit tests

run `node --test tests/firefox-extension.test.mjs`. The tests use Node's built-in test runner and require no additional packages.
