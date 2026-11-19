# Repository Guidelines

## Project Structure & Module Organization

This workspace contains the URL Volume Limiter browser extension in `sounds-limiter/`, organized by browser:

- `chrome/` and `edge/`: Manifest V3 extensions, popup UI, service worker, shared limiter scripts, and Node tests in `tests/`.
- `firefox/`: Firefox manifest and content script, with tests in `tests/`.
- `safari/`: Safari Web Extension manifest and scripts, with tests in `tests/`.

Keep browser-specific manifests and packaging instructions in their respective directories. When changing shared behavior, check each browser variant for parity.

## Build, Test, and Development Commands

Run commands from the relevant browser directory:

- `cd sounds-limiter/chrome && npm test` — run Chrome tests using Node's built-in test runner.
- `cd sounds-limiter/edge && npm test` — run Edge tests.
- `cd sounds-limiter/firefox && node --test tests/firefox-extension.test.mjs` — run Firefox tests.
- `cd sounds-limiter/safari && node --test tests/safari-extension.test.mjs` — run Safari tests.
- `cd sounds-limiter/firefox && web-ext build` — package a Firefox add-on (requires `web-ext`).
- `cd sounds-limiter/safari && xcrun safari-web-extension-packager --copy-resources .` — start Safari app packaging (requires Xcode tools).

For local browser development, load the unpacked extension from the relevant directory and reload matching pages after script changes.

## Coding Style & Naming Conventions

Use the existing plain JavaScript style: semicolons, `const`/`let`, descriptive camelCase identifiers, and two-space indentation. Keep UI markup, styles, and scripts in the existing `popup.html`, `popup.css`, and `popup.js` files. Name tests after the behavior or browser integration they cover, and place them under that browser's `tests/` directory. Avoid introducing dependencies when Node's built-in APIs suffice.

## Testing Guidelines

Add or update tests for changes to volume caps, URL-prefix matching, settings, and browser message handling. Use Node's `node:test` runner and run the affected browser suite; run all four suites for cross-browser behavior changes. Tests require Node.js 18 or later for the Chrome and Edge workflows.

## Commit & Pull Request Guidelines

Use a concise imperative subject that names the browser or behavior (for example, `Fix Firefox media volume cap`). In pull requests, summarize the behavior change, list affected browser variants, provide test commands and results, and include screenshots for popup UI changes. Call out manifest permission changes explicitly.

## Security & Configuration

Request only the host permissions needed for configured URL prefixes. Keep site matching and volume settings local to the extension; do not add network transmission of user settings. Review manifest permission changes alongside the relevant privacy documentation.
