# Registry Administration Guide

## Overview

VicPol Desktop uses an encrypted registry system (like Windows Registry) to control which apps can have system-level privileges. The registry is stored in an encrypted `.reg` file that can only be modified by administrators.

## Registry File

**Location:** `/registry/system.reg`

**Format:** Encrypted registry file
- Contains Base64-encoded JSON
- Includes cryptographic signature
- Cannot be edited manually
- Must use admin tool to modify

## System Architecture

```
┌─────────────────────────────────────────┐
│  Encrypted .reg File                    │
│  (system.reg)                           │
│                                         │
│  [ENCRYPTED_DATA]                       │
│  eyJhdXRob3JpemVkU3lz...                │
│                                         │
│  [METADATA]                             │
│  Version=1.0.0                          │
│  Signature=VICPOL_REGISTRY...           │
└─────────────────────────────────────────┘
          ↓ (Decrypted at runtime)
┌─────────────────────────────────────────┐
│  Registry Loader                        │
│  (registryLoader.js)                    │
│                                         │
│  - Reads .reg file                      │
│  - Decrypts Base64                      │
│  - Verifies signature                   │
│  - Returns authorized apps list         │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  App Registry                           │
│  (appRegistry.js)                       │
│                                         │
│  - Validates all apps                   │
│  - Checks against whitelist             │
│  - Blocks unauthorized system apps      │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  Desktop / App Store                    │
│                                         │
│  - System apps: Always visible          │
│  - User apps: Show in App Store         │
└─────────────────────────────────────────┘
```

## Using the Admin Tool

### Installation

The admin tool is a Node.js script located at:
```
/scripts/generateRegistry.js
```

### Running the Tool

```bash
cd /path/to/vicpol-react/scripts
node generateRegistry.js
```

### Interactive Process

**Step 1: Tool starts**
```
╔════════════════════════════════════════════════════════════╗
║         VicPol Desktop Registry Admin Tool                ║
║         Generate Encrypted .reg Files                     ║
╚════════════════════════════════════════════════════════════╝

📋 Current Registry File Found

Current Authorized System Apps:
  1. app-store
  2. browser

Version: 1.0.0
Created: 2026-01-23T06:15:00Z
```

**Step 2: Enter apps**
```
Enter authorized system apps (comma-separated)
Example: app-store,browser,settings

Authorized Apps: app-store,browser,settings
```

**Step 3: Confirm**
```
📝 Apps to authorize:
  1. app-store
  2. browser
  3. settings

Generate registry file? (y/n): y
```

**Step 4: Generated**
```
✅ Registry file generated successfully!
   Location: /path/to/registry/system.reg

📋 Encrypted Data (Base64):
   eyJhdXRob3JpemVkU3lzdGVtQXBwcyI6WyJhcHAtc3RvcmUiLCJicm93...

🔐 This file is encrypted and can only be modified using this tool.
```

### Adding a New System App

**Example: Adding a "Settings" app**

1. **Create the app** in `/src/applications/settings/`

2. **Run admin tool:**
```bash
node scripts/generateRegistry.js
```

3. **Enter apps:**
```
Authorized Apps: app-store,browser,settings
```

4. **Confirm:** Press `y`

5. **Restart app** - New registry will be loaded

6. **Settings app is now:**
   - ✅ System-level (can't be uninstalled)
   - ✅ Hidden from App Store
   - ✅ Always on desktop

### Removing a System App

**Example: Removing "settings"**

1. **Run admin tool:**
```bash
node scripts/generateRegistry.js
```

2. **Enter apps (without settings):**
```
Authorized Apps: app-store,browser
```

3. **Confirm:** Press `y`

4. **Restart app**

5. **Settings is now:**
   - ❌ Not a system app anymore
   - ✅ Becomes a regular user app
   - ✅ Shows in App Store
   - ✅ Can be uninstalled

## Registry File Format

### Raw File Content

```
VICPOL Desktop Registry File v1.0
================================
Encrypted Registry Data
DO NOT EDIT MANUALLY

[ENCRYPTED_DATA]
eyJhdXRob3JpemVkU3lzdGVtQXBwcyI6WyJhcHAtc3RvcmUiLCJicm93c2VyIl0sInZlcnNpb24iOiIxLjAuMCIsImNyZWF0ZWRBdCI6IjIwMjYtMDEtMjNUMDY6MTU6MDBaIiwic2lnbmF0dXJlIjoiVklDUE9MX1JFR0lTVFJZX1NJR05BVFVSRV92MS4wIn0=

[METADATA]
Version=1.0.0
LastModified=2026-01-23T06:15:00Z
Signature=VICPOL_REGISTRY_SIGNATURE_v1.0
```

### Decrypted Data Structure

```json
{
  "authorizedSystemApps": [
    "app-store",
    "browser"
  ],
  "version": "1.0.0",
  "createdAt": "2026-01-23T06:15:00Z",
  "signature": "VICPOL_REGISTRY_SIGNATURE_v1.0"
}
```

## Security Features

### Encryption

**Current:** Base64 encoding with signature verification
**Future:** Can be upgraded to AES-256, RSA, or other encryption

### Signature Verification

Every registry file includes a signature:
```
VICPOL_REGISTRY_SIGNATURE_v1.0
```

If signature doesn't match:
- ❌ Registry is rejected
- ❌ No system apps authorized
- ❌ All apps become user apps (secure fallback)

### Tamper Detection

If someone tries to edit the `.reg` file manually:

**Scenario 1: Invalid Base64**
```
❌ Failed to decrypt registry data
   Using fallback: No system apps authorized
```

**Scenario 2: Signature Mismatch**
```
❌ Registry signature verification failed!
   File may have been tampered with.
```

**Scenario 3: Invalid JSON**
```
❌ Invalid registry structure
   Using fallback: No system apps authorized
```

All scenarios result in **secure fallback** - no system apps authorized.

## Third-Party Protection

### What Third-Party Developers See

```javascript
// Third-party app config.json
{
  "appId": "my-app",
  "isSystemApp": true  // They try this
}
```

### What Happens

1. **Registry loads** authorized apps from encrypted file
2. **App Registry checks** if "my-app" is in list
3. **Not found** - "my-app" is not authorized
4. **Override** - Sets `isSystemApp: false`
5. **Log warning:**
```
⚠️  Security Warning: App "my-app" claims isSystemApp=true but is not authorized!
   Only authorized apps can be system apps. Setting isSystemApp=false.
```

6. **Result:** App works fine as regular user app

## Best Practices

### For Administrators

✅ **DO:**
- Use the admin tool to modify registry
- Keep registry file in source control
- Document why each app is system-level
- Regularly review authorized apps
- Test changes in development first

❌ **DON'T:**
- Edit .reg file manually
- Share registry signature publicly
- Authorize unnecessary apps
- Remove core system apps (app-store, browser)

### For Developers

✅ **DO:**
- Create apps as user apps (`isSystemApp: false`)
- Request system-level status if truly needed
- Understand why request might be denied
- Test app as both user and system app

❌ **DON'T:**
- Try to bypass registry security
- Assume your app will be system-level
- Hard-code system-level behavior
- Complain if denied system status

## Console Output

### Successful Load

```
🔓 Registry loaded successfully
   Version: 1.0.0
   Authorized System Apps: app-store, browser
   Created: 2026-01-23T06:15:00Z

📋 App Registry Initialized:
   Total Apps: 3
   System Apps: 2
   User Apps: 1
```

### Failed Load (Tampered)

```
❌ Registry signature verification failed!
   File may have been tampered with.
❌ Failed to decrypt registry
   Using fallback: No system apps authorized

📋 App Registry Initialized:
   Total Apps: 3
   System Apps: 0
   User Apps: 3
```

### Unauthorized App Attempt

```
⚠️  Security Warning: App "malicious-app" claims isSystemApp=true but is not authorized!
   Only authorized apps can be system apps. Setting isSystemApp=false.

✅ App "Malicious App" registered successfully
```

## Upgrading Encryption

The current system uses Base64 encoding. To upgrade to real encryption:

### Option 1: AES-256

```javascript
// In registryLoader.js
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.REGISTRY_KEY; // From secure env
const ALGORITHM = 'aes-256-gcm';

function decryptRegistryData(encryptedData) {
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  // ... decrypt
}
```

### Option 2: RSA Public/Private Keys

```javascript
// Admin tool uses private key to encrypt
// App uses public key to decrypt
// Cannot be re-encrypted without private key
```

### Option 3: Digital Signatures

```javascript
// Sign with private key
// Verify with public key
// Ensures authenticity and integrity
```

## Troubleshooting

### Registry File Not Found

**Symptom:**
```
❌ Failed to parse registry file
   Using fallback: No system apps authorized
```

**Solution:**
1. Run `node scripts/generateRegistry.js`
2. Generate new registry file
3. Restart application

### All Apps Become User Apps

**Symptom:**
- System apps show in App Store
- Can uninstall Browser/App Store
- Console shows "System Apps: 0"

**Solution:**
- Registry file is corrupted or tampered
- Regenerate using admin tool
- Check file permissions

### Admin Tool Won't Run

**Symptom:**
```
Error: Cannot find module 'readline'
```

**Solution:**
```bash
# Ensure Node.js is installed
node --version

# Run from correct directory
cd scripts/
node generateRegistry.js
```

## Summary

**For Admins:**
- Encrypted .reg file controls system apps
- Use admin tool to modify
- Secure by default
- Cannot be manually edited

**For Platform:**
- Loads from encrypted file
- Verifies signature
- Secure fallback if compromised
- Third-party apps blocked from system status

**For Developers:**
- Can't fake system status
- Must request authorization
- Apps work fine as user apps
- Clear security boundaries

**Perfect balance: Secure + Flexible!** 🔒📋
