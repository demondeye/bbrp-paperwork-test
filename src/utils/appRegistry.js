// ============================================================================
// SECURE APP REGISTRY SYSTEM
// ============================================================================
// This file acts like Windows Registry - validates and manages all applications
// Reads authorized system apps from encrypted .reg file

import vicpolConfig from '../applications/vicpol-paperwork/config.json';
import appStoreConfig from '../applications/app-store/config.json';
import browserConfig from '../applications/browser/config.json';
import learningCenterConfig from '../applications/learning-center/config.json';

// Import icons
import vicpolIcon from '../applications/vicpol-paperwork/AppIcon/icon.png';
import appStoreIcon from '../applications/app-store/AppIcon/icon.png';
import browserIcon from '../applications/browser/AppIcon/icon.png';

// Import encrypted registry loader
import { loadAuthorizedSystemApps } from './registryLoader';

// ============================================================================
// SECURITY: LOAD AUTHORIZED SYSTEM APPS FROM ENCRYPTED FILE
// ============================================================================
// The whitelist is stored in an encrypted .reg file
// Defines which apps are system-level (default) for ALL users
// This prevents third-party apps from making themselves uninstallable

let AUTHORIZED_SYSTEM_APPS = loadAuthorizedSystemApps();

// ============================================================================
// ICON MAPPING
// ============================================================================

const iconMap = {
  'vicpol-paperwork': vicpolIcon,
  'app-store': appStoreIcon,
  'browser': browserIcon
};

function resolveIcon(appId, iconPath, iconType) {
  if (iconType === 'emoji') {
    return iconPath;
  }
  
  if (iconType === 'image' && iconPath.startsWith('./')) {
    return iconMap[appId] || iconPath;
  }
  
  return iconPath;
}

// ============================================================================
// VALIDATION & SECURITY
// ============================================================================

/**
 * Validate app configuration has all required fields
 */
function validateAppConfig(app) {
  const required = ['appId', 'name', 'author', 'version', 'icon', 'iconType', 'description'];
  
  for (const field of required) {
    if (!app[field]) {
      console.error(`❌ App Registry Error: App "${app.appId || 'unknown'}" missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}

/**
 * SECURITY: Verify if app is authorized to be a system app
 * This prevents third-party apps from claiming system privileges
 */
function verifySystemAppAuthorization(app) {
  // If app claims to be a system app, verify it's authorized
  if (app.isSystemApp === true) {
    if (!AUTHORIZED_SYSTEM_APPS.includes(app.appId)) {
      console.warn(`⚠️  Security Warning: App "${app.appId}" claims isSystemApp=true but is not authorized!`);
      console.warn(`   Only authorized apps can be system apps. Setting isSystemApp=false.`);
      return false;
    }
  }
  
  return app.isSystemApp === true;
}

/**
 * Process and secure app configuration
 */
function processAppConfig(config) {
  // Validate required fields
  if (!validateAppConfig(config)) {
    return null;
  }
  
  // Security check: verify system app authorization
  const isAuthorizedSystemApp = verifySystemAppAuthorization(config);
  
  // Build secured app object
  return {
    ...config,
    isSystemApp: isAuthorizedSystemApp,  // Override with authorized value
    icon: resolveIcon(config.appId, config.icon, config.iconType),
    // Add metadata
    _registeredAt: new Date().toISOString(),
    _isVerified: true
  };
}

// ============================================================================
// BUILD APP REGISTRY
// ============================================================================

const APP_REGISTRY = [
  processAppConfig(vicpolConfig),
  processAppConfig(appStoreConfig),
  processAppConfig(browserConfig),
  processAppConfig(learningCenterConfig)
].filter(Boolean); // Remove any invalid apps

// Log registry status
console.log('📋 App Registry Initialized:');
console.log(`   Total Apps: ${APP_REGISTRY.length}`);
console.log(`   System Apps: ${APP_REGISTRY.filter(a => a.isSystemApp).length}`);
console.log(`   User Apps: ${APP_REGISTRY.filter(a => !a.isSystemApp).length}`);

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get all registered applications
 */
export function getAllApps() {
  return APP_REGISTRY;
}

/**
 * Get a specific app by ID
 */
export function getAppById(appId) {
  return APP_REGISTRY.find(app => app.appId === appId);
}

/**
 * Get apps by category
 */
export function getAppsByCategory(category) {
  return APP_REGISTRY.filter(app => app.category === category);
}

/**
 * Get all system apps (OS-level, can't be uninstalled)
 * These are verified and authorized apps only
 */
export function getSystemApps() {
  return APP_REGISTRY.filter(app => app.isSystemApp === true);
}

/**
 * Get all user apps (can be installed/uninstalled)
 */
export function getUserApps() {
  return APP_REGISTRY.filter(app => app.isSystemApp !== true);
}

/**
 * Check if an app is a system app (verified)
 */
export function isSystemApp(appId) {
  const app = getAppById(appId);
  return app ? app.isSystemApp === true : false;
}

/**
 * Get apps available in App Store
 * System apps are hidden from App Store
 */
export function getAppStoreApps() {
  return APP_REGISTRY.filter(app => app.isSystemApp !== true);
}

/**
 * Get apps that should show on desktop
 * System apps always show, user apps only if installed
 */
export function getDesktopApps(installedApps = []) {
  return APP_REGISTRY.filter(app => {
    if (app.isSystemApp) return true; // System apps always visible
    return installedApps.includes(app.appId); // User apps only if installed
  });
}

/**
 * Check if an app can be uninstalled
 * System apps cannot be uninstalled
 */
export function canUninstall(appId) {
  return !isSystemApp(appId);
}

/**
 * Get default installed apps (for new users)
 * System apps + any default user apps
 */
export function getDefaultInstalledApps() {
  const systemAppIds = getSystemApps().map(app => app.appId);
  const defaultUserApps = ['vicpol-paperwork']; // User apps that come pre-installed
  return [...systemAppIds, ...defaultUserApps];
}

/**
 * Register a new app (for third-party developers)
 * SECURITY: Will automatically validate and strip unauthorized system privileges
 */
export function registerApp(appConfig) {
  const processed = processAppConfig(appConfig);
  
  if (!processed) {
    console.error('❌ Failed to register app:', appConfig.appId);
    return false;
  }
  
  // Check for duplicate
  if (getAppById(processed.appId)) {
    console.warn(`⚠️  App "${processed.appId}" is already registered!`);
    return false;
  }
  
  APP_REGISTRY.push(processed);
  console.log(`✅ App "${processed.name}" registered successfully`);
  return true;
}

/**
 * Get authorized system apps list (for documentation)
 */
export function getAuthorizedSystemApps() {
  return [...AUTHORIZED_SYSTEM_APPS];
}
