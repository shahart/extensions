# Chrome Web Store Listing — URL Volume Limiter

> Last Updated: 2026-11-13

## Store Listing

**Extension Name**: URL Volume Limiter

**Short Description**: Set URL prefixes and a maximum volume for matching audio and video.

**Detailed Description**

Add URL prefixes and choose a volume cap from 1% to 100% so selected streams stay at or below your chosen level.

Add or remove URL prefixes in the extension popup. Chrome asks for access to the site when you add a prefix. The limiter applies automatically to media whose source starts with a saved prefix, including players added after the page loads.

The GLGLZ and KAN Gimmel stream prefixes and the YouTube watch URL prefix are included by default. Other URL prefixes can be added in the popup.

To use it, add a URL prefix and grant access to its site when Chrome asks. Open a matching page to use the limiter.

The URL prefixes you save stay locally in Chrome. The extension does not transmit them or collect browsing history or website content. It runs only on the sites for which you grant access.

**Category**: Accessibility (suggested; confirm the closest available category in the dashboard)

**Single Purpose**: Lets users manage URL prefixes and set the maximum volume for matching audio and video media.

**Primary Language**: English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 | 1280×800 or 640×400 | ⬜ Not created | Capture the matching page playing the supported stream with Chrome's extension UI visible |
| Screenshot 2 | 1280×800 or 640×400 | ⬜ Not created | Optional: show the same player before/after at a safe volume setting |
| Small Promo Tile | 440×280 | ⬜ Not created | Optional |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | Optional |

Screenshots must show the real extension working on its supported page. Avoid implying that it works on other sites or controls Chrome's standalone audio viewer.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Saves the URL prefixes that users add in the popup so they remain available when Chrome restarts. |
| `scripting` | permissions | Registers the volume limiter only on URL prefixes the user adds and grants site access to. |
| `http://*/*`, `https://*/*` | optional_host_permissions | Lets users grant access to the specific HTTP or HTTPS site they add. Access is requested one site at a time and is not required for other sites. |

No host access is requested at installation. For each saved prefix, the extension registers the limiter on that path and requests permission for that prefix's site origin.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No.

The extension stores user-entered URL prefixes and the selected maximum volume locally in Chrome and reads media source addresses only to determine whether the volume cap applies. These values are not transmitted or shared. It does not use analytics, cookies, or third-party services.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**: Required before submission. Publish `PRIVACY.md` at a publicly accessible URL and enter that URL in the dashboard.

## Distribution

**Visibility**: Public (suggested)
**Regions**: All regions (suggested)

## Developer Info

**Publisher Name**: Required — enter the publisher name associated with the Chrome Web Store developer account.

**Contact Email**: Required — enter a monitored public support email address.

**Support URL / Email**: Required for a useful support path — not provided in this project.

**Homepage URL**: Optional — not provided.

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-11-13 | POC. GLGLZ only. No UI - hard-coded volume | Draft |
| 1.1.0 | 2026-11-13 | Added a popup for managing URL prefixes and per-site access. | Draft |
| 1.2.0 | 2026-11-15 | Added a user-adjustable maximum volume setting. | Draft |
| 1.3.0 | 2026-11-16 | Added KAN Gimmel and YouTube watch URLs by default, enforced caps in the page's main world, and logged volume percentages. | Prepared |

## Review Notes

### Known Issues / Limitations

- Site access must be granted for each saved URL prefix's site before the limiter can run there.
- Only HTML audio and video elements are controlled. Chrome's standalone audio viewer and audio outside page media elements are not affected.
- Capture a genuine listing screenshot before upload.
- Confirm the publisher contact, category, public privacy policy URL, and store listing details in the developer dashboard.

### Rejection History

None.
