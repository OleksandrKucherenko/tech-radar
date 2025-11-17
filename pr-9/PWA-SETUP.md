# Tech Radar Builder - PWA Setup Guide

## Overview

The Tech Radar Builder is now a fully functional Progressive Web App (PWA) that can be installed on your local machine and used completely offline.

## Features

✅ **Installable** - Install the app directly from your browser
✅ **Offline Support** - Work with the radar builder without internet connection
✅ **Automatic Updates** - Get notified when new versions are available
✅ **Fast Loading** - Cached resources load instantly
✅ **Cross-Platform** - Works on desktop and mobile devices

## Installation Instructions

### From Web Browser (Desktop)

1. **Visit the Builder**
   - Navigate to: https://oleksandrkucherenko.github.io/tech-radar/builder.html

2. **Install the App**
   - **Chrome/Edge**: Look for the install icon (⊕) in the address bar or click the three-dot menu → "Install Tech Radar Builder"
   - **Firefox**: Click the three-dot menu → "Install" (when available)
   - **Safari**: Not supported for installation, but offline functionality works

3. **Launch the Installed App**
   - The app will appear in your applications menu
   - Launch it like any other desktop application
   - It will open in its own window without browser UI

### From Mobile Device

1. **iOS (Safari)**
   - Visit https://oleksandrkucherenko.github.io/tech-radar/builder.html
   - Tap the Share button (square with arrow pointing up)
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add" to confirm
   - The icon will appear on your home screen

2. **Android (Chrome)**
   - Visit https://oleksandrkucherenko.github.io/tech-radar/builder.html
   - Tap the three-dot menu
   - Tap "Add to Home screen" or "Install app"
   - Tap "Add" to confirm
   - The icon will appear on your home screen

## Offline Usage

### How It Works

The PWA automatically caches all necessary resources:
- HTML, CSS, and JavaScript files
- D3.js visualization library
- jsPDF and html2canvas for export features
- Font Awesome icons

### First-Time Setup

1. **Initial Visit** (Requires Internet)
   - Visit the builder page once while online
   - The service worker will automatically cache all resources
   - Check the browser console for "[PWA] Service Worker registered successfully"

2. **Verify Offline Capability**
   - After the initial visit, you can go completely offline
   - The app will continue to work without any internet connection
   - All features remain functional (create, edit, export radar)

### Using Offline

Once installed and cached:
1. **Disconnect from Internet** (optional, to test)
2. **Launch the App** from your applications menu or home screen
3. **Create and Edit** your tech radar normally
4. **Export** configurations as JSON, PNG, or PDF
5. **Data Persistence** - All your work is saved in browser localStorage

## Features Available Offline

✅ Create and edit technology entries
✅ Configure quadrants and rings
✅ Customize radar visualization
✅ Export as PNG
✅ Export as PDF
✅ Export configuration as JSON
✅ Import configuration from JSON
✅ Generate embed code
✅ Copy share URLs

## Developer Testing

### Local Development

```bash
# Start the development server
bun start

# Access the builder
# Navigate to: http://localhost:3000/builder.html
```

### Service Worker Testing

1. **Open DevTools**
   - Press F12 or right-click → Inspect

2. **Check Service Worker Registration**
   - Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
   - Navigate to "Service Workers" section
   - Verify "builder-sw.js" is registered and active

3. **Inspect Cache**
   - In the same "Application" tab
   - Navigate to "Cache Storage"
   - You should see:
     - `tech-radar-builder-v1` (precached resources)
     - `tech-radar-builder-runtime-v1` (runtime cache)

4. **Test Offline Mode**
   - In DevTools, go to "Network" tab
   - Enable "Offline" checkbox
   - Refresh the page - it should still work

### Console Messages

When the PWA is working correctly, you'll see these console messages:

```
[Service Worker] Script loaded
[Service Worker] Installing...
[Service Worker] Caching local resources
[Service Worker] Caching CDN resources
[Service Worker] Installation complete
[Service Worker] Activating...
[Service Worker] Activation complete
[PWA] Service Worker registered successfully: https://...
```

## Updating the PWA

### Automatic Updates

When a new version is deployed:
1. The service worker detects the update
2. A blue banner appears at the top of the page
3. Click "Update Now" to reload and get the latest version
4. Or click "Dismiss" to continue with the current version

### Manual Update Check

1. Open the installed app
2. Check browser DevTools → Application → Service Workers
3. Click "Update" button to force check for updates

## Troubleshooting

### PWA Not Installing

**Problem**: No install prompt appears

**Solutions**:
- Ensure you're using HTTPS (required for PWA)
- Check that the manifest file is loading correctly
- Verify service worker is registered (check DevTools)
- Some browsers require the user to interact with the page first

### Offline Mode Not Working

**Problem**: App doesn't work offline

**Solutions**:
1. **Clear Cache and Retry**
   - DevTools → Application → Clear Storage
   - Check "Cache storage" and "Service workers"
   - Click "Clear site data"
   - Refresh and let it cache again

2. **Check Service Worker Status**
   - DevTools → Application → Service Workers
   - Verify status is "activated and running"

3. **Verify Network Requests**
   - DevTools → Network tab
   - Look for "(ServiceWorker)" in the Size column
   - This indicates resources are served from cache

### Updates Not Showing

**Problem**: New version banner doesn't appear

**Solutions**:
- Close and reopen the app
- Manually unregister the service worker:
  - DevTools → Application → Service Workers
  - Click "Unregister"
  - Refresh the page

## Browser Compatibility

| Browser | Install | Offline | Notes |
|---------|---------|---------|-------|
| Chrome | ✅ | ✅ | Full support |
| Edge | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Safari (Desktop) | ⚠️ | ✅ | Limited install support |
| Safari (iOS) | ✅ | ✅ | Use "Add to Home Screen" |
| Chrome (Android) | ✅ | ✅ | Full support |

## Technical Details

### Files Created

1. **`docs/builder.webmanifest`**
   - Web App Manifest for installation metadata
   - Defines app name, icons, theme colors
   - Specifies start URL and display mode

2. **`docs/builder-sw.js`**
   - Service Worker script
   - Handles caching strategy
   - Manages offline functionality
   - Network-first with cache fallback

3. **Modified: `docs/builder.html`**
   - Added PWA meta tags
   - Service worker registration code
   - Update notification UI

### Caching Strategy

**Network First with Cache Fallback**:
- Try to fetch from network first
- If successful, update the cache
- If offline, serve from cache
- If cache miss, show offline message

### Cache Versioning

Cache names include version numbers:
- `tech-radar-builder-v1` - Main cache
- `tech-radar-builder-runtime-v1` - Runtime cache

When updating, increment the version in `builder-sw.js` to force cache refresh.

## Security Considerations

### HTTPS Requirement
- Service Workers require HTTPS
- Exception: `localhost` for development

### Data Privacy
- All data stored locally in browser
- No data sent to external servers
- LocalStorage persists across sessions
- Clearing browser data removes all saved radars

## Support

For issues or questions:
- GitHub Issues: https://github.com/OleksandrKucherenko/tech-radar/issues
- Check browser console for error messages
- Include browser version and OS when reporting issues

## Version History

### v1.0 (Current)
- Initial PWA implementation
- Offline functionality
- Auto-update notifications
- Cross-platform support
