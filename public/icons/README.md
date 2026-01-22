# App Icons Directory

Place your 512x512 app icons here.

## Icon Requirements:
- **Size:** 512x512 pixels
- **Format:** PNG, JPG, or SVG
- **Naming:** Use app-id.png (e.g., `my-app.png`)
- **Background:** Transparent PNG recommended

## Usage in appRegistry.js:

```javascript
{
  appId: 'my-app',
  name: 'My Application',
  icon: '/icons/my-app.png',  // Path to icon
  iconType: 'image',           // Set to 'image'
  description: 'My app description',
  requiresPin: 'no'
}
```

## Emoji Icons (Alternative):

If you prefer emoji icons instead:

```javascript
{
  appId: 'my-app',
  name: 'My Application',
  icon: '🎯',                  // Emoji
  iconType: 'emoji',           // Set to 'emoji'
  description: 'My app description',
  requiresPin: 'no'
}
```

## Icon Best Practices:
- Use consistent style across all app icons
- Ensure icons are clear and recognizable at small sizes
- Test how icons look on both light and dark backgrounds
- Consider using rounded corners for a more polished look
