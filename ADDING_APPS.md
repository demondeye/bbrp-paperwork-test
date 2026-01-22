# Adding New Applications - Developer Guide

## Quick Start: 3 Steps to Add a New App

### Step 1: Create Your App Component

Create a new folder in `src/applications/`:

```
src/applications/
└── my-app/
    ├── MyApp.jsx           # Main app component
    └── components/         # Optional sub-components
```

Example `MyApp.jsx`:
```jsx
export default function MyApp({ user, onClose }) {
  return (
    <div className="h-full bg-[#0a0a0a] text-white p-6">
      <h1 className="text-3xl font-bold mb-4">My Application</h1>
      <p>Your app content here...</p>
    </div>
  );
}
```

### Step 2: Register in App Registry

Edit `src/utils/appRegistry.js` and add your app:

```javascript
const APP_REGISTRY = [
  // ... existing apps ...
  {
    appId: 'my-app',
    name: 'My Application',
    author: 'Your Name or Company',
    version: '1.0.0',
    icon: '🎯',              // Emoji OR '/icons/my-app.png'
    iconType: 'emoji',       // 'emoji' OR 'image'
    description: 'Brief description of what your app does',
    requiresPin: 'no'        // 'yes' or 'no'
  }
];
```

### Step 3: Add Render Case in App.jsx

Edit `src/App.jsx` and add your app to the window rendering:

```javascript
import MyApp from './applications/my-app/MyApp';

// ... in the render section ...

{openApplications.map(app => {
  // ... existing app cases ...
  
  if (app.id === 'my-app') {
    return (
      <Window
        key={app.id}
        title={app.name}
        icon={app.icon}
        onClose={() => handleCloseApp(app.id)}
        onMinimize={() => handleMinimizeApp(app.id)}
        isMinimized={app.isMinimized}
        defaultWidth={1200}
        defaultHeight={800}
      >
        <MyApp user={user} onClose={() => handleCloseApp(app.id)} />
      </Window>
    );
  }
  
  return null;
})}
```

## Icon Options

### Option 1: Emoji Icon (Simple)
```javascript
icon: '🎯',
iconType: 'emoji'
```

### Option 2: Image Icon (Professional)
```javascript
icon: '/icons/my-app.png',  // 512x512px PNG
iconType: 'image'
```

Place your icon in `public/icons/my-app.png`

## App Component Props

Your app component receives:

```javascript
{
  user: {
    uid: string,
    email: string,
    fullName: string,
    rank: string,
    unit: string,
    division: string
  },
  onClose: () => void,      // Close the app window
  onMinimize: () => void,   // Minimize the app window (optional)
  isMinimized: boolean      // Current minimize state (optional)
}
```

## Window Component Props

Configure your app window:

```javascript
<Window
  title="App Name"           // Window title
  icon="🎯"                  // Window icon
  onClose={handleClose}      // Required
  onMinimize={handleMinimize} // Optional
  defaultWidth={1200}        // Default: 1200
  defaultHeight={800}        // Default: 800
  startMaximized={false}     // Start maximized?
  isMinimized={false}        // Controlled minimize state
>
  <YourAppContent />
</Window>
```

## PIN Protection (Coming Soon)

Set `requiresPin: 'yes'` in your app config to require a PIN before opening.

```javascript
{
  appId: 'secure-app',
  name: 'Secure Application',
  icon: '🔒',
  iconType: 'emoji',
  requiresPin: 'yes',  // User must enter PIN to open
  version: '1.0.0'
}
```

## Styling Guidelines

### Use Tailwind CSS Classes
```jsx
<div className="bg-[#0a0a0a] text-white p-6">
  <h1 className="text-3xl font-bold mb-4">Title</h1>
  <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
    Click Me
  </button>
</div>
```

### Color Palette
- Background: `bg-[#0a0a0a]`
- Cards: `bg-[#1a1a1a]`
- Text: `text-white`, `text-white/70`
- Primary: `bg-blue-600`
- Success: `bg-green-600`
- Danger: `bg-red-600`

## Firebase Integration

Access Firestore from your app:

```javascript
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Read data
const docRef = doc(db, 'myCollection', user.uid);
const docSnap = await getDoc(docRef);

// Write data
await setDoc(doc(db, 'myCollection', user.uid), {
  field: 'value'
});
```

## Complete Example: Simple Note App

```jsx
// src/applications/notes/NotesApp.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function NotesApp({ user }) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    const docRef = doc(db, 'notes', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setNotes(docSnap.data().content);
    }
  };

  const saveNotes = async () => {
    await setDoc(doc(db, 'notes', user.uid), {
      content: notes,
      updatedAt: new Date()
    });
  };

  return (
    <div className="h-full bg-[#0a0a0a] p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-2xl font-bold">My Notes</h1>
        <button 
          onClick={saveNotes}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 bg-[#1a1a1a] text-white p-4 rounded border border-white/10 resize-none outline-none"
        placeholder="Start typing your notes..."
      />
    </div>
  );
}
```

Register it:
```javascript
// src/utils/appRegistry.js
{
  appId: 'notes',
  name: 'Notes',
  author: 'Your Name',
  version: '1.0.0',
  icon: '📝',
  iconType: 'emoji',
  description: 'Quick note-taking app with cloud sync',
  requiresPin: 'no'
}
```

## Troubleshooting

### App doesn't appear in App Store
- Check `appRegistry.js` - is your app added?
- Check console for errors

### App doesn't open when clicked
- Did you add the render case in `App.jsx`?
- Check the `appId` matches exactly

### Icon doesn't show
- Emoji: Make sure iconType is 'emoji'
- Image: Check file exists in `public/icons/`
- Image: Check path starts with `/icons/`

## Need Help?

Check existing apps like `vicpol-paperwork` for reference!
