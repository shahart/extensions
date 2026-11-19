# URL Volume Limiter

A minimal Manifest V3 Chrome extension that caps matching audio and video elements at a user-selected maximum volume (2% by default).

Use the extension popup to set the maximum volume from 1% to 100%, and add or remove URL prefixes. Chrome asks for access to each site's host when you add a prefix. The original stream prefix is included when the extension is first installed.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Reload any matching page that was already open.

The GLGLZ and KAN Gimmel stream prefixes, along with `https://www.youtube.com/watch*`, are included by default. The limiter caps HTML audio and video elements whose source starts with one of your saved prefixes. It cannot change the volume of Chrome's built-in standalone audio viewer or audio rendered outside the page's media elements. URL prefixes are saved locally in Chrome and are not synced or transmitted.

## Run unit tests

Requires Node.js 18 or later. Run `npm test` to test volume limiting, URL-prefix matching, and live updates to the selected cap.
