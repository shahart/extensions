# URL Volume Limiter for Safari

Safari version of the URL Volume Limiter. It matches the Chrome extension's configurable maximum volume and URL-prefix list, and requests site access only for origins the user adds. Settings are stored locally in the extension.

## Build the Safari app

Safari Web Extensions are distributed inside a macOS or iOS app. With Xcode command line tools installed, run from this directory:

```sh
xcrun safari-web-extension-packager --copy-resources .
```

Follow the prompts to choose the app name, bundle identifier, and platforms. Open the generated project in Xcode, select your signing team, and run the containing app once to install the extension. Then enable **URL Volume Limiter** in Safari > Settings > Extensions.

The extension uses Safari's Manifest V3 `scripting` API to register content scripts for granted origins and optional host permissions for site-by-site access. Dynamic content script registration requires Safari 16.4 or later. The page-world limiter is loaded from a web-accessible extension resource, so it does not rely on manifest `world: "MAIN"` support.

## Development

Enable Safari's Develop menu and allow unsigned extensions if needed. Use the extension popup to set the maximum volume and manage URL prefixes. Safari prompts for access when a site is added; after changing permissions for an existing page, reload that page if the limiter was not injected into its current document.
