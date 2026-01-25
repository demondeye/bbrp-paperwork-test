# App Icon System - Developer Guide

## Overview

Each app has its icon stored in an `AppIcon` subfolder. This keeps apps self-contained and organized.

## Icon Storage Structure

```
src/applications/
└── my-app/
    ├── MyApp.jsx
    ├── config.json
    └── AppIcon/
        └── icon.png        ← Icon file (512x512 PNG)
```

## Example: Sheriff App

```
src/applications/
└── sheriff/
    ├── SheriffApp.jsx
    ├── config.json
    └── AppIcon/
        └── icon.png        ← Sheriff badge icon
```

**config.json:**
```json
{
  "appId": "sheriff",
  "name": "Sheriff",
  "icon": "./AppIcon/icon.png",
  "iconType": "image"
}
```

## Icon Format

### PNG Icon (RECOMMENDED)
- **Location:** `AppIcon/icon.png` in app folder
- **Size:** 512x512px (minimum)
- **Format:** PNG with transparency recommended
- **File name:** Must be `icon.png`

**config.json:**
```json
{
  "icon": "./AppIcon/icon.png",
  "iconType": "image"
}
```

**Folder structure:**
```
sheriff/
├── SheriffApp.jsx
├── config.json
└── AppIcon/
    └── icon.png    ← 512x512 PNG
```

### Alternative: Emoji Icon
- **No folder needed**
- **Simple:** Just use emoji character

**config.json:**
```json
{
  "icon": "👮",
  "iconType": "emoji"
}
```

## Creating SVG Icons

### Template (512x512, iOS-style rounded corners)

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with iOS rounded corners -->
  <rect width="512" height="512" rx="115" fill="#007AFF"/>
  
  <!-- Your icon design here -->
  <circle cx="256" cy="256" r="100" fill="white"/>
</svg>
```

### Design Guidelines

1. **Use 512x512 viewBox** - Standard iOS app icon size
2. **Rounded corners: rx="115"** - Matches iOS corner radius
3. **Simple & recognizable** - Clear at small sizes
4. **Use gradients** - Makes icons pop
5. **High contrast** - Ensure visibility on any background

### Example Icons

**Notes App:**
```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#FFD60A"/>
  <rect x="80" y="80" width="352" height="352" rx="20" fill="white"/>
  <rect x="120" y="140" width="272" height="12" rx="6" fill="#FFD60A"/>
  <rect x="120" y="180" width="240" height="12" rx="6" fill="#FFD60A"/>
  <rect x="120" y="220" width="260" height="12" rx="6" fill="#FFD60A"/>
</svg>
```

**Calculator App:**
```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="url(#grad)"/>
  <rect x="60" y="60" width="392" height="120" rx="20" fill="white" opacity="0.9"/>
  <rect x="60" y="210" width="90" height="90" rx="15" fill="white" opacity="0.9"/>
  <rect x="170" y="210" width="90" height="90" rx="15" fill="white" opacity="0.9"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="512" y2="512">
      <stop stop-color="#FF9500"/>
      <stop offset="1" stop-color="#FF6B00"/>
    </linearGradient>
  </defs>
</svg>
```

## Registering Icons in appRegistry.js

### Step-by-Step

1. **Import the config:**
```javascript
import sheriffConfig from '../applications/sheriff/config.json';
```

2. **Import the icon:**
```javascript
import sheriffIcon from '../applications/sheriff/AppIcon/icon.png';
```

3. **Add to iconMap:**
```javascript
const iconMap = {
  'vicpol-paperwork': vicpolIcon,
  'app-store': appStoreIcon,
  'sheriff': sheriffIcon  // Add your app here
};
```

4. **Add to APP_REGISTRY:**
```javascript
const APP_REGISTRY = [
  {
    ...vicpolConfig,
    icon: resolveIcon(vicpolConfig.appId, vicpolConfig.icon, vicpolConfig.iconType)
  },
  {
    ...sheriffConfig,
    icon: resolveIcon(sheriffConfig.appId, sheriffConfig.icon, sheriffConfig.iconType)
  }
];
```

## Complete Example - Weather App

### 1. Create icon.png

Create a 512x512 PNG icon and save it as:
`src/applications/weather/AppIcon/icon.png`

**Folder structure:**
```
weather/
├── WeatherApp.jsx
├── config.json
└── AppIcon/
    └── icon.png    ← 512x512 PNG with weather icon
```

### 2. Create config.json

`src/applications/weather/config.json`:
```json
{
  "appId": "weather",
  "name": "Weather",
  "author": "System",
  "version": "1.0.0",
  "icon": "./AppIcon/icon.png",
  "iconType": "image",
  "description": "Check current weather and forecasts",
  "requiresPin": "no"
}
```

### 3. Update appRegistry.js

```javascript
// Imports
import weatherConfig from '../applications/weather/config.json';
import weatherIcon from '../applications/weather/AppIcon/icon.png';

// Icon map
const iconMap = {
  'vicpol-paperwork': vicpolIcon,
  'app-store': appStoreIcon,
  'weather': weatherIcon
};

// Registry
const APP_REGISTRY = [
  // ... existing apps ...
  {
    ...weatherConfig,
    icon: resolveIcon(weatherConfig.appId, weatherConfig.icon, weatherConfig.iconType)
  }
];
```

## Icon Best Practices

### Do's ✅
- Use SVG for scalability
- Keep designs simple
- Use iOS-style rounded corners (rx="115")
- Use gradients for depth
- Test at different sizes
- Use standard 512x512 dimensions

### Don'ts ❌
- Don't use complex details
- Don't use thin lines (< 2px)
- Don't use small text
- Don't forget rounded corners
- Don't use raster images if possible

## Color Recommendations

**iOS-Inspired Gradients:**
```
Blue:   #007AFF → #5856D6
Orange: #FF9500 → #FF6B00
Green:  #34C759 → #30D158
Red:    #FF3B30 → #FF2D55
Purple: #AF52DE → #BF5AF2
Pink:   #FF2D55 → #FF375F
Yellow: #FFD60A → #FFCC00
```

## Testing Your Icon

1. **Check in App Store list** - Should be clear at 64x64px
2. **Check on desktop** - Should be recognizable
3. **Check in taskbar** - Should work at 40x40px
4. **Check in detail view** - Should look good at 72x72px

## Troubleshooting

**Icon doesn't show:**
- Verify file exists in app folder
- Check file name matches config.json
- Ensure icon is imported in appRegistry.js
- Check iconType is "image"
- Look for console errors

**Icon looks blurry:**
- Use SVG instead of PNG
- Ensure PNG is at least 512x512px
- Check if image path is correct

**Icon has wrong shape:**
- Add `rx="115"` to background rect
- Ensure viewBox is "0 0 512 512"
- Check SVG is properly formatted

## Migration Guide

### Converting Emoji to Image

**Before:**
```json
{
  "icon": "📋",
  "iconType": "emoji"
}
```

**After:**
1. Create AppIcon.svg in app folder
2. Update config.json:
```json
{
  "icon": "./AppIcon.svg",
  "iconType": "image"
}
```
3. Import in appRegistry.js
4. Add to iconMap

## Summary

**Folder Structure:**
```
my-app/
├── MyApp.jsx
├── config.json
└── AppIcon/
    └── icon.png    ← 512x512 PNG
```

**Steps:**
1. Create `AppIcon` folder in your app directory
2. Add `icon.png` (512x512 PNG) to AppIcon folder
3. Set config.json: `"icon": "./AppIcon/icon.png"`, `"iconType": "image"`
4. Import in appRegistry.js: `import myIcon from '../applications/my-app/AppIcon/icon.png'`
5. Add to iconMap: `'my-app': myIcon`
6. Add to APP_REGISTRY with resolveIcon

**Example path format:**
```
sheriff/AppIcon/icon.png  ← Sheriff app icon
weather/AppIcon/icon.png  ← Weather app icon
notes/AppIcon/icon.png    ← Notes app icon
```

Your app now has a beautiful, organized icon system! 🎨
