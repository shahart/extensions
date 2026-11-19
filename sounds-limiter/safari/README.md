# URL Volume Limiter for Safari

This is the Safari Web Extension source, copied from the Chrome extension. It injects the same script into matching CDN and YouTube watch pages and caps HTML audio/video volume at 1%.

## Build the Safari app

Safari Web Extensions are distributed inside a macOS or iOS app. With Xcode command line tools installed, run from this directory:

```sh
xcrun safari-web-extension-packager --copy-resources .
```

Follow the prompts to choose the app name, bundle identifier, and macOS (or macOS and iOS) platforms. The packager creates an Xcode project. Open it in Xcode, select your signing team, and run the containing app once to install the extension. Then enable **URL Volume Limiter** in Safari > Settings > Extensions.

For development, enable Safari's Develop menu and allow unsigned extensions if needed. Grant the extension access to the matching sites in Safari's extension settings. The content script loads `volume-limiter-main.js` into the page world through a web-accessible extension resource, so it does not depend on Safari's newer `world: "MAIN"` manifest support.
