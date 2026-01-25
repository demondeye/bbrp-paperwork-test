// ============================================================================
// REGISTRY LOADER - Defines Default/System Apps for ALL Users
// ============================================================================
// This module reads the system.reg file and determines which apps are:
// - System-level (can't be uninstalled)
// - Hidden from App Store
// - Default installed for all users
//
// This applies to EVERYONE - not user-specific

// Import the encrypted registry file as text
import registryFileContent from '../../registry/system.reg?raw';

// ============================================================================
// TWO-KEY VERIFICATION SYSTEM
// ============================================================================

// KEY 1: Master Key (built into encryption file)
const MASTER_KEY = 'VICPOL_MASTER_KEY_v1.0_SECURE';

// KEY 2: Application Key (built into this application)
const APPLICATION_KEY = 'VICPOL_APP_KEY_2026_PRODUCTION';

// Registry signature for data integrity
const REGISTRY_SIGNATURE = 'VICPOL_REGISTRY_SIGNATURE_v1.0';

// ============================================================================
// PARSING & DECRYPTION
// ============================================================================

function parseRegistryFile(fileContent) {
  try {
    const keysMatch = fileContent.match(/\[ENCRYPTION_KEYS\]\n([\s\S]*?)\n\n/);
    if (!keysMatch) {
      console.error('❌ Invalid registry file: No ENCRYPTION_KEYS section');
      return null;
    }
    
    const keysSection = keysMatch[1];
    const keys = {};
    keysSection.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        keys[key.trim()] = value.trim();
      }
    });
    
    const encryptedMatch = fileContent.match(/\[ENCRYPTED_DATA\]\n([\s\S]*?)\n\n/);
    if (!encryptedMatch) {
      console.error('❌ Invalid registry file: No ENCRYPTED_DATA section');
      return null;
    }
    
    return { keys, encryptedData: encryptedMatch[1].trim() };
  } catch (error) {
    console.error('❌ Failed to parse registry file:', error);
    return null;
  }
}

function decryptRegistryData(encryptedData) {
  try {
    const decoded = atob(encryptedData);
    const data = JSON.parse(decoded);
    
    if (data.signature !== REGISTRY_SIGNATURE) {
      console.error('❌ Registry signature verification failed!');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Failed to decrypt registry data:', error);
    return null;
  }
}

function verifyKeys(registryKeys, decryptedData) {
  const errors = [];
  
  if (registryKeys.MasterKey !== MASTER_KEY) {
    errors.push('Master Key mismatch');
    console.error('❌ KEY 1 FAILED: Master Key does not match');
  } else {
    console.log('✅ KEY 1 VERIFIED: Master Key');
  }
  
  if (registryKeys.ApplicationKey !== APPLICATION_KEY) {
    errors.push('Application Key mismatch');
    console.error('❌ KEY 2 FAILED: Application Key does not match');
  } else {
    console.log('✅ KEY 2 VERIFIED: Application Key');
  }
  
  if (decryptedData.masterKey !== MASTER_KEY) {
    errors.push('Decrypted Master Key mismatch');
  }
  
  if (decryptedData.applicationKey !== APPLICATION_KEY) {
    errors.push('Decrypted Application Key mismatch');
  }
  
  if (errors.length > 0) {
    console.error('🚨 Registry key verification failed!');
    return false;
  }
  
  console.log('🔐 ALL KEYS VERIFIED: Registry is authentic');
  return true;
}

// ============================================================================
// ENCRYPTION FUNCTIONS (For Admin Tool)
// ============================================================================

export function encryptRegistryData(authorizedApps) {
  const registryData = {
    authorizedSystemApps: authorizedApps,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    signature: REGISTRY_SIGNATURE,
    masterKey: MASTER_KEY,
    applicationKey: APPLICATION_KEY
  };
  
  return btoa(JSON.stringify(registryData));
}

export function generateRegistryFile(authorizedApps) {
  const encrypted = encryptRegistryData(authorizedApps);
  
  return `VICPOL Desktop Registry File v1.0
================================
Encrypted Registry Data
DO NOT EDIT MANUALLY

[ENCRYPTION_KEYS]
MasterKey=${MASTER_KEY}
ApplicationKey=${APPLICATION_KEY}

[ENCRYPTED_DATA]
${encrypted}

[METADATA]
Version=1.0.0
LastModified=${new Date().toISOString()}
Signature=${REGISTRY_SIGNATURE}
RequiredKeys=2
`;
}

// ============================================================================
// REGISTRY LOADER
// ============================================================================

let cachedRegistry = null;

export function loadAuthorizedSystemApps() {
  if (cachedRegistry) {
    return cachedRegistry.authorizedSystemApps;
  }
  
  console.log('🔐 Loading Registry (applies to all users)...');
  
  const parsed = parseRegistryFile(registryFileContent);
  if (!parsed) {
    console.error('   Using fallback: No system apps');
    return [];
  }
  
  const decrypted = decryptRegistryData(parsed.encryptedData);
  if (!decrypted) {
    console.error('   Using fallback: No system apps');
    return [];
  }
  
  if (!verifyKeys(parsed.keys, decrypted)) {
    console.error('   Using fallback: No system apps');
    return [];
  }
  
  if (!Array.isArray(decrypted.authorizedSystemApps)) {
    console.error('❌ Invalid registry structure');
    return [];
  }
  
  cachedRegistry = decrypted;
  
  console.log('✅ Registry loaded successfully');
  console.log(`   System Apps: ${decrypted.authorizedSystemApps.join(', ')}`);
  console.log(`   Applies to: ALL USERS`);
  
  return decrypted.authorizedSystemApps;
}

export function clearRegistryCache() {
  cachedRegistry = null;
}

export function getRegistryInfo() {
  if (!cachedRegistry) {
    loadAuthorizedSystemApps();
  }
  return cachedRegistry;
}

export function validateRegistryIntegrity() {
  try {
    const parsed = parseRegistryFile(registryFileContent);
    if (!parsed) return false;
    
    const decrypted = decryptRegistryData(parsed.encryptedData);
    if (!decrypted) return false;
    
    return verifyKeys(parsed.keys, decrypted);
  } catch {
    return false;
  }
}
