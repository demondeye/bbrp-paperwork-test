# App Configuration Structure

## Complete App Config Example

```javascript
{
  appId: 'my-app',              // Unique identifier (lowercase, no spaces)
  name: 'My Application',       // Display name
  author: 'John Doe',           // Developer name or company
  version: '1.2.3',             // Semantic versioning (major.minor.patch)
  icon: '🎯',                   // Emoji OR image path
  iconType: 'emoji',            // 'emoji' or 'image'
  description: 'A comprehensive description of what your app does and its key features.',
  requiresPin: 'no'             // 'yes' or 'no'
}
```

## Field Descriptions

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `appId` | string | Unique app identifier | `'vicpol-paperwork'` |
| `name` | string | App display name | `'VicPol Paperwork'` |
| `author` | string | Developer/company name | `'VicPol Dev Team'` |
| `version` | string | Version number | `'1.0.0'` |
| `icon` | string | Emoji or image path | `'📋'` or `'/icons/app.png'` |
| `iconType` | string | Icon format | `'emoji'` or `'image'` |
| `description` | string | Brief app description | `'Professional tool...'` |
| `requiresPin` | string | PIN requirement | `'yes'` or `'no'` |

## Visual Display in App Store

```
┌─────────────────────────────────────────┐
│  📋  My Application                     │
│      John Doe • v1.2.3                  │
│      [Installed] [🔒 PIN Required]      │
│                                         │
│  A comprehensive description of what    │
│  your app does and its key features.    │
│                                         │
│  [Open]  [Uninstall]                    │
└─────────────────────────────────────────┘
```

## Icon Types

### Emoji Icon
```javascript
icon: '📋',
iconType: 'emoji'
```
- Simple and quick to implement
- No files needed
- Limited design options
- Good for prototyping

### Image Icon
```javascript
icon: '/icons/my-app.png',
iconType: 'image'
```
- Professional appearance
- Custom branding
- 512x512 PNG recommended
- Place in `public/icons/`

## Version Numbering

Follow semantic versioning:
- `1.0.0` - Major.Minor.Patch
- `1.0.1` - Bug fix (patch)
- `1.1.0` - New feature (minor)
- `2.0.0` - Breaking change (major)

## Author Field

Can be:
- Individual name: `'John Doe'`
- Company name: `'VicPol Development Team'`
- Organization: `'BBRP Systems'`
- System apps: `'System'`

## Description Guidelines

Good descriptions:
✅ Clear and concise
✅ Mention key features
✅ 1-2 sentences
✅ Professional tone

Example:
```javascript
description: 'Professional arrest report and paperwork tool with cloud sync, OCR support, and 100+ pre-defined charges.'
```

Bad descriptions:
❌ Too vague: "A useful tool"
❌ Too long: Multiple paragraphs
❌ Marketing speak: "The best app ever!"

## Complete Examples

### Simple App
```javascript
{
  appId: 'calculator',
  name: 'Calculator',
  author: 'System',
  version: '1.0.0',
  icon: '🔢',
  iconType: 'emoji',
  description: 'Basic calculator for quick calculations.',
  requiresPin: 'no'
}
```

### Professional App
```javascript
{
  appId: 'case-manager',
  name: 'Case Manager Pro',
  author: 'LegalTech Solutions',
  version: '2.5.3',
  icon: '/icons/case-manager.png',
  iconType: 'image',
  description: 'Comprehensive case management system with document tracking, deadlines, and client communication tools.',
  requiresPin: 'yes'
}
```

### Internal Tool
```javascript
{
  appId: 'admin-panel',
  name: 'Admin Panel',
  author: 'IT Department',
  version: '1.0.0',
  icon: '⚙️',
  iconType: 'emoji',
  description: 'System administration and configuration panel. Access restricted to administrators.',
  requiresPin: 'yes'
}
```

## Validation Checklist

Before adding your app to the registry:

- [ ] appId is unique and lowercase
- [ ] name is descriptive
- [ ] author is specified
- [ ] version follows X.Y.Z format
- [ ] icon exists (emoji or file)
- [ ] iconType matches icon format
- [ ] description is clear and concise
- [ ] requiresPin is 'yes' or 'no'

## Common Mistakes

1. **Missing fields** - All fields are required
2. **Wrong iconType** - Must match icon format
3. **Invalid version** - Use X.Y.Z format
4. **Duplicate appId** - Each must be unique
5. **Missing icon file** - Image icons must exist in `public/icons/`
