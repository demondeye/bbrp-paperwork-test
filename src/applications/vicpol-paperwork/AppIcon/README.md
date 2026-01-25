# AppIcon Folder

This folder contains the app's icon image.

## Structure
```
AppIcon/
└── icon.png       # App icon (512x512 recommended)
```

## Requirements
- **Format:** PNG (with transparency recommended)
- **Size:** 512x512px minimum
- **File name:** Must be `icon.png`

## Usage in config.json
```json
{
  "icon": "./AppIcon/icon.png",
  "iconType": "image"
}
```

## Creating Icons
1. Design a 512x512px PNG icon
2. Save as `icon.png` in this folder
3. Icon will automatically be used in App Store and desktop

## Example Structure
```
src/applications/
└── my-app/
    ├── MyApp.jsx
    ├── config.json
    └── AppIcon/
        └── icon.png    ← Your icon here
```
