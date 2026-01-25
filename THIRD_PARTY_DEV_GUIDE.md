# Third-Party App Development Guide

## Overview

VicPol Desktop supports third-party applications through a secure registry system. Anyone can develop apps for the platform, but security measures prevent unauthorized system-level access.

## Security Model

### App Levels

**System Apps (OS-Level)**
- Cannot be uninstalled
- Always visible on desktop
- Hidden from App Store
- **REQUIRES AUTHORIZATION** - Only core OS apps can have this status
- Examples: App Store, Browser

**User Apps (Regular Apps)**
- Can be installed/uninstalled
- Visible in App Store
- Only on desktop when installed
- **Open to all developers** - No special authorization needed
- Examples: VicPol Paperwork, your custom apps

### Authorization System

The registry has a **whitelist** of authorized system apps:

```javascript
// src/utils/appRegistry.js
const AUTHORIZED_SYSTEM_APPS = [
  'app-store',
  'browser'
];
```

**Security Protection:**
- If your app sets `"isSystemApp": true` but is NOT in the whitelist
- The registry will **automatically override** it to `false`
- Console warning will be logged
- Your app will be treated as a regular user app

**This prevents malicious apps from:**
- Making themselves uninstallable
- Hiding from the App Store
- Claiming OS-level privileges

## Creating Your App

### Step 1: File Structure

```
src/applications/
└── my-app/
    ├── MyApp.jsx          # Main component
    ├── config.json        # App metadata
    └── AppIcon/
        └── icon.png       # App icon (512x512)
```

### Step 2: config.json

**Template:**
```json
{
  "appId": "my-app",
  "name": "My Awesome App",
  "author": "Your Name",
  "version": "1.0.0",
  "icon": "./AppIcon/icon.png",
  "iconType": "image",
  "description": "What your app does",
  "requiresPin": "no",
  "isSystemApp": false
}
```

**Required Fields:**
- `appId` - Unique identifier (lowercase, hyphens)
- `name` - Display name
- `author` - Your name or company
- `version` - Semantic version
- `icon` - Path to icon file or emoji
- `iconType` - "image" or "emoji"
- `description` - Brief description
- `isSystemApp` - **Always set to `false`** for third-party apps

**Important:**
- Set `"isSystemApp": false` for your apps
- Even if you set it to `true`, the registry will override it
- Only authorized OS apps can be system apps

### Step 3: Main Component

```jsx
import { useState } from 'react';

export default function MyApp({ user, onClose, onMinimize, isMinimized, zIndex }) {
  const [data, setData] = useState('');

  return (
    <div className="h-full bg-white p-6">
      <h1 className="text-2xl font-bold mb-4">My App</h1>
      {/* Your app UI here */}
    </div>
  );
}
```

**Props provided:**
- `user` - Current user object (uid, email, fullName)
- `onClose` - Function to close app
- `onMinimize` - Function to minimize app
- `isMinimized` - Boolean, is window minimized
- `zIndex` - Window layer number

### Step 4: Register in appRegistry.js

```javascript
// 1. Import config
import myAppConfig from '../applications/my-app/config.json';

// 2. Import icon
import myAppIcon from '../applications/my-app/AppIcon/icon.png';

// 3. Add to iconMap
const iconMap = {
  'vicpol-paperwork': vicpolIcon,
  'app-store': appStoreIcon,
  'browser': browserIcon,
  'my-app': myAppIcon  // Add here
};

// 4. Add to registry
const APP_REGISTRY = [
  processAppConfig(vicpolConfig),
  processAppConfig(appStoreConfig),
  processAppConfig(browserConfig),
  processAppConfig(myAppConfig)  // Add here
].filter(Boolean);
```

**Security Check:**
The `processAppConfig()` function will:
1. Validate all required fields
2. Check if `isSystemApp: true`
3. Verify app is in `AUTHORIZED_SYSTEM_APPS` whitelist
4. Override to `false` if not authorized
5. Log security warning

### Step 5: Add Window Rendering in App.jsx

```javascript
// 1. Import your component
import MyApp from './applications/my-app/MyApp';

// 2. Add rendering case (around line 300)
if (app.id === 'my-app') {
  return (
    <Window
      key={app.id}
      title={app.name}
      icon={app.icon}
      onClose={() => handleCloseApp(app.id)}
      onMinimize={() => handleMinimizeApp(app.id)}
      isMinimized={app.isMinimized}
      zIndex={app.zIndex}
      defaultWidth={1000}
      defaultHeight={700}
    >
      <MyApp
        user={user}
        onClose={() => handleCloseApp(app.id)}
        onMinimize={() => handleMinimizeApp(app.id)}
        isMinimized={app.isMinimized}
        zIndex={app.zIndex}
      />
    </Window>
  );
}
```

## Registry API

Your app can use these functions:

```javascript
import { 
  getAllApps,           // Get all apps
  getAppById,           // Get specific app
  getSystemApps,        // Get OS-level apps
  getUserApps,          // Get user apps
  isSystemApp,          // Check if system app
  canUninstall          // Check if can uninstall
} from '../utils/appRegistry';
```

## Testing Security

**Test 1: Try to claim system status**
```json
{
  "appId": "my-app",
  "isSystemApp": true  // Set this
}
```

**Result:**
```
⚠️  Security Warning: App "my-app" claims isSystemApp=true but is not authorized!
   Only authorized apps can be system apps. Setting isSystemApp=false.
```

Your app will work fine, but as a regular user app.

**Test 2: Verify in console**
```javascript
import { isSystemApp } from './utils/appRegistry';
console.log(isSystemApp('my-app')); // false (overridden)
console.log(isSystemApp('browser')); // true (authorized)
```

## App Behavior

**User Apps (Your Apps):**
✅ Show in App Store
✅ Can be installed by users
✅ Can be uninstalled
✅ Only on desktop when installed
✅ Normal app lifecycle

**System Apps (OS Only):**
❌ Hidden from App Store
❌ Cannot be installed (always present)
❌ Cannot be uninstalled
❌ Always on desktop
❌ Requires authorization

## Example: Complete App

See `/src/applications/vicpol-paperwork/` for a complete example of a user app.

**Key files:**
- `VicPolApp.jsx` - Main component
- `config.json` - Metadata with `isSystemApp: false`
- `AppIcon/icon.png` - App icon

## Frequently Asked Questions

**Q: Can I make my app a system app?**
A: No. Only authorized OS components can be system apps. Your app will automatically be treated as a user app.

**Q: What happens if I set `isSystemApp: true`?**
A: The registry will override it to `false` and log a security warning. Your app will work normally as a user app.

**Q: How do I get my app authorized as a system app?**
A: System apps are core OS components only. Third-party apps should be user apps. Contact the project maintainer if you believe your app should be core OS functionality.

**Q: Can my app access system app APIs?**
A: All apps have the same API access. System vs User status only affects installation/uninstallation behavior.

**Q: Will my app work if it's not authorized?**
A: Yes! Your app will work perfectly as a user app. Most apps should be user apps anyway.

## Best Practices

1. **Always set `isSystemApp: false`** in your config
2. **Don't try to bypass security** - it won't work
3. **Follow the file structure** - makes apps consistent
4. **Use Firestore** for data persistence
5. **Handle user auth** properly with `user` prop
6. **Test installation/uninstallation** flow
7. **Provide good descriptions** for App Store

## Summary

**For Developers:**
- Create apps freely as user apps
- Set `isSystemApp: false` in config
- Register in appRegistry.js
- Add window rendering in App.jsx
- Your app appears in App Store
- Users can install/uninstall

**Security Ensures:**
- Only authorized apps can be system apps
- Malicious apps can't make themselves permanent
- Third-party apps are safe and removable
- Platform stability is maintained

**Welcome to VicPol Desktop development!** 🚀
