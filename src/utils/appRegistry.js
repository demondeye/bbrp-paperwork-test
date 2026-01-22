// App Registry - Centralized list of all available applications
// Add new apps here as they are created

// Icon can be:
// - Emoji string: '🎯'
// - Image path: '/icons/app-name.png' (512x512 recommended)

const APP_REGISTRY = [
  {
    appId: 'vicpol-paperwork',
    name: 'VicPol Paperwork',
    author: 'VicPol Development Team',
    version: '1.0.0',
    icon: '📋', // Emoji icon
    iconType: 'emoji',
    description: 'Professional arrest report and paperwork tool with cloud sync, OCR support, and 100+ pre-defined charges.',
    requiresPin: 'no'
  },
  {
    appId: 'app-store',
    name: 'App Store',
    author: 'System',
    version: '1.0.0',
    icon: '🏪', // Emoji icon
    iconType: 'emoji',
    description: 'Browse and manage applications for your desktop environment.',
    requiresPin: 'no'
  }
  // Example with image icon:
  // {
  //   appId: 'example-app',
  //   name: 'Example App',
  //   author: 'Your Name',
  //   version: '1.0.0',
  //   icon: '/icons/example-app.png', // Image path
  //   iconType: 'image',
  //   description: 'An example application',
  //   requiresPin: 'no'
  // }
];

export function getAllApps() {
  return APP_REGISTRY;
}

export function getAppById(appId) {
  return APP_REGISTRY.find(app => app.appId === appId);
}

export function getAppsByCategory(category) {
  return APP_REGISTRY.filter(app => app.category === category);
}
