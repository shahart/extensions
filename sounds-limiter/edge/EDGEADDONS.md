# Microsoft Edge Add-ons listing — URL Volume Limiter

## Listing

**Name:** URL Volume Limiter  
**Short description:** Set URL prefixes and a maximum volume for matching audio and video.  
**Category:** Accessibility (choose the closest available category in Partner Center)  
**Language:** English (United States)  
**Visibility:** Public  
**Markets:** All markets

### Description

Set a maximum volume for audio and video on selected URL prefixes. Choose a cap from 1% to 100%, then add or remove URL prefixes in the extension popup. Microsoft Edge asks for access to each site when you add a prefix. The limiter applies to matching HTML audio and video, including media players added after a page loads.

The GLGLZ and KAN Gimmel stream prefixes and the YouTube watch URL prefix are included by default. You can add other URL prefixes in the popup. The limiter runs only on sites for which you grant access. It cannot change the volume of Edge's built-in standalone audio viewer or audio rendered outside page media elements.

Saved URL prefixes and the volume cap remain in Microsoft Edge's local extension storage. The extension does not transmit them or collect browsing history or website content.

### Assets

| Asset | Status | Notes |
| --- | --- | --- |
| Extension logo | Ready | `icons/icon-128.png`, 128×128 PNG (meets the 128×128 minimum; 300×300 recommended) |
| Small promotional tile | Optional, not created | 440×280 PNG |
| Screenshots | Optional, not created | Up to six; 640×480 or 1280×800 |
| Large promotional tile | Optional, not created | 1400×560 PNG |

### Privacy and review declarations

**Single purpose:** Lets users manage URL prefixes and set the maximum volume for matching audio and video media.

**`storage`:** Saves user-entered URL prefixes and the selected maximum volume in local extension storage so they remain available when Edge restarts.

**`scripting`:** Registers the limiter on saved URL prefixes for which the user has granted site access, and applies it to matching media in open tabs.

**Optional host permissions:** `http://*/*` and `https://*/*` allow the user to grant access to a specific site they add. No host access is requested at installation; access is requested when needed for a saved prefix.

**Remote code:** No. The extension executes only code included in its package.

**Data use:** No personal data is collected or transmitted. URL prefixes and the volume cap stay in local extension storage. Media source addresses are checked locally on matching pages to determine whether the cap applies.

**Privacy policy URL:** Required if Partner Center treats the extension's locally accessed data as privacy information. Publish `PRIVACY.md` at a publicly accessible URL and enter that URL. The file itself is not a public URL.

### Account details needed in Partner Center

- Microsoft Edge Add-ons developer account.
- Publisher name and monitored support contact from the account or listing.
- Public privacy policy URL.

No website or support contact is currently configured in this project. Screenshots and promotional tiles are optional in Partner Center.

## Package

Upload `url-volume-limiter-v1.3.0.zip` (or regenerate it with `./package-extension.sh`). It contains the manifest and all runtime files, with no `update_url` field.

## Certification notes

URL Volume Limiter caps HTML audio and video elements whose source begins with a user-configured URL prefix. On first install, it includes the GLGLZ, KAN Gimmel, and YouTube watch prefixes. To test: install the extension, open its popup, add a URL prefix if needed, grant site access when prompted, then open or refresh a matching page containing audio or video. The cap is adjustable from 1% to 100% (default 2%). The extension does not affect Edge's standalone audio viewer or media outside page audio/video elements.
