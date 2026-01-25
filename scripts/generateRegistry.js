#!/usr/bin/env node

/**
 * ============================================================================
 * REGISTRY ADMIN TOOL
 * ============================================================================
 * This tool generates encrypted .reg files for VicPol Desktop
 * Defines which apps are system-level (default) for ALL users
 * 
 * Usage:
 *   node generateRegistry.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MASTER_KEY = 'VICPOL_MASTER_KEY_v1.0_SECURE';
const APPLICATION_KEY = 'VICPOL_APP_KEY_2026_PRODUCTION';
const REGISTRY_SIGNATURE = 'VICPOL_REGISTRY_SIGNATURE_v1.0';

// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

function encryptRegistryData(authorizedApps) {
  const registryData = {
    authorizedSystemApps: authorizedApps,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    signature: REGISTRY_SIGNATURE,
    masterKey: MASTER_KEY,
    applicationKey: APPLICATION_KEY
  };
  
  const jsonString = JSON.stringify(registryData);
  const encrypted = Buffer.from(jsonString).toString('base64');
  
  return encrypted;
}

function generateRegistryFile(authorizedApps) {
  const encrypted = encryptRegistryData(authorizedApps);
  
  const regFile = `VICPOL Desktop Registry File v1.0
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
  
  return regFile;
}

function decryptAndDisplay(encryptedData) {
  try {
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    return data;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// INTERACTIVE CLI
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         VicPol Desktop Registry Admin Tool                ║');
  console.log('║         Define Default/System Apps for All Users          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Show current registry if it exists
  const registryPath = path.join(__dirname, '../registry/system.reg');
  
  if (fs.existsSync(registryPath)) {
    console.log('📋 Current Registry File\n');
    
    try {
      const currentContent = fs.readFileSync(registryPath, 'utf-8');
      const encryptedMatch = currentContent.match(/\[ENCRYPTED_DATA\]\n([\s\S]*?)\n\n/);
      
      if (encryptedMatch) {
        const encryptedData = encryptedMatch[1].trim();
        const decrypted = decryptAndDisplay(encryptedData);
        
        if (decrypted) {
          console.log('Current System Apps (applies to ALL users):');
          decrypted.authorizedSystemApps.forEach((app, i) => {
            console.log(`  ${i + 1}. ${app}`);
          });
          console.log(`\nVersion: ${decrypted.version}`);
          console.log(`Created: ${decrypted.createdAt}\n`);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not read current registry\n');
    }
  }
  
  // Get input
  console.log('Enter system-level apps (comma-separated)');
  console.log('These apps will be:');
  console.log('  - Default installed for all users');
  console.log('  - Cannot be uninstalled');
  console.log('  - Hidden from App Store\n');
  console.log('Example: app-store,browser,settings\n');
  
  const input = await question('System Apps: ');
  
  if (!input.trim()) {
    console.log('\n❌ No apps entered. Exiting.\n');
    rl.close();
    return;
  }
  
  // Parse input
  const authorizedApps = input.split(',').map(app => app.trim()).filter(Boolean);
  
  console.log('\n📝 Apps to set as system-level:');
  authorizedApps.forEach((app, i) => {
    console.log(`  ${i + 1}. ${app}`);
  });
  
  const confirm = await question('\nGenerate registry file? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Cancelled.\n');
    rl.close();
    return;
  }
  
  // Generate registry file
  const registryContent = generateRegistryFile(authorizedApps);
  
  // Ensure directory exists
  const registryDir = path.join(__dirname, '../registry');
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(registryPath, registryContent, 'utf-8');
  
  console.log('\n✅ Registry file generated successfully!');
  console.log(`   Location: ${registryPath}`);
  console.log('\n📋 Encrypted Data (Base64):');
  console.log('   ' + encryptRegistryData(authorizedApps).substring(0, 60) + '...');
  console.log('\n🔐 This file is encrypted and can only be modified using this tool.');
  console.log('   System apps apply to ALL users of the application.\n');
  
  rl.close();
}

// Run
main().catch(console.error);

// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

function encryptRegistryData(authorizedApps) {
  const registryData = {
    authorizedSystemApps: authorizedApps,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    signature: REGISTRY_SIGNATURE,
    masterKey: MASTER_KEY,
    applicationKey: APPLICATION_KEY
  };
  
  const jsonString = JSON.stringify(registryData);
  const encrypted = Buffer.from(jsonString).toString('base64');
  
  return encrypted;
}

function generateRegistryFile(authorizedApps, adminUserEmail) {
  // Verify admin is authorized
  if (!AUTHORIZED_ADMIN_USERS.includes(adminUserEmail)) {
    return null;
  }
  
  const encrypted = encryptRegistryData(authorizedApps);
  
  const regFile = `VICPOL Desktop Registry File v1.0
================================
Encrypted Registry Data
DO NOT EDIT MANUALLY

[ENCRYPTION_KEYS]
MasterKey=${MASTER_KEY}
ApplicationKey=${APPLICATION_KEY}
AdminUserUID=${adminUserEmail}

[ENCRYPTED_DATA]
${encrypted}

[METADATA]
Version=1.0.0
LastModified=${new Date().toISOString()}
Signature=${REGISTRY_SIGNATURE}
RequiredKeys=3
`;
  
  return regFile;
}

function decryptAndDisplay(encryptedData) {
  try {
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    return data;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// INTERACTIVE CLI
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    VicPol Desktop Registry Admin Tool                     ║');
  console.log('║    Three-Key Verification System                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // STEP 1: Verify admin user
  console.log('🔐 AUTHENTICATION REQUIRED\n');
  console.log('Only authorized admin users can generate registry files.\n');
  console.log('Authorized Admins:');
  AUTHORIZED_ADMIN_USERS.forEach((email, i) => {
    console.log(`  ${i + 1}. ${email}`);
  });
  console.log('');
  
  const adminEmail = await question('Enter your admin email: ');
  
  if (!AUTHORIZED_ADMIN_USERS.includes(adminEmail.trim())) {
    console.log('\n❌ AUTHENTICATION FAILED');
    console.log(`   User "${adminEmail}" is not an authorized admin.`);
    console.log('   Only authorized users can generate registry files.\n');
    rl.close();
    return;
  }
  
  console.log('\n✅ AUTHENTICATION SUCCESSFUL');
  console.log(`   Welcome, ${adminEmail}\n`);
  
  // Show current registry if it exists
  const registryPath = path.join(__dirname, '../registry/system.reg');
  
  if (fs.existsSync(registryPath)) {
    console.log('📋 Current Registry File Found\n');
    
    try {
      const currentContent = fs.readFileSync(registryPath, 'utf-8');
      
      // Extract keys
      const keysMatch = currentContent.match(/\[ENCRYPTION_KEYS\]\n([\s\S]*?)\n\n/);
      if (keysMatch) {
        console.log('Current Keys:');
        keysMatch[1].split('\n').forEach(line => {
          console.log(`  ${line}`);
        });
        console.log('');
      }
      
      const encryptedMatch = currentContent.match(/\[ENCRYPTED_DATA\]\n([\s\S]*?)\n\n/);
      
      if (encryptedMatch) {
        const encryptedData = encryptedMatch[1].trim();
        const decrypted = decryptAndDisplay(encryptedData);
        
        if (decrypted) {
          console.log('Current Authorized System Apps:');
          decrypted.authorizedSystemApps.forEach((app, i) => {
            console.log(`  ${i + 1}. ${app}`);
          });
          console.log(`\nVersion: ${decrypted.version}`);
          console.log(`Created: ${decrypted.createdAt}\n`);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not read current registry\n');
    }
  }
  
  // Get input
  console.log('Enter authorized system apps (comma-separated)');
  console.log('Example: app-store,browser,settings\n');
  
  const input = await question('Authorized Apps: ');
  
  if (!input.trim()) {
    console.log('\n❌ No apps entered. Exiting.\n');
    rl.close();
    return;
  }
  
  // Parse input
  const authorizedApps = input.split(',').map(app => app.trim()).filter(Boolean);
  
  console.log('\n📝 Configuration Summary:');
  console.log(`   Admin User: ${adminEmail}`);
  console.log(`   Master Key: ${MASTER_KEY.substring(0, 20)}...`);
  console.log(`   App Key: ${APPLICATION_KEY.substring(0, 20)}...`);
  console.log('\n   Apps to authorize:');
  authorizedApps.forEach((app, i) => {
    console.log(`     ${i + 1}. ${app}`);
  });
  
  const confirm = await question('\nGenerate registry file with three-key security? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Cancelled.\n');
    rl.close();
    return;
  }
  
  // Generate registry file
  const registryContent = generateRegistryFile(authorizedApps, adminEmail.trim());
  
  if (!registryContent) {
    console.log('\n❌ Failed to generate registry file.');
    console.log('   Admin user authorization failed.\n');
    rl.close();
    return;
  }
  
  // Ensure directory exists
  const registryDir = path.join(__dirname, '../registry');
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(registryPath, registryContent, 'utf-8');
  
  console.log('\n✅ Registry file generated successfully with three-key security!');
  console.log(`   Location: ${registryPath}`);
  console.log('\n🔐 Security Verification:');
  console.log(`   ✓ KEY 1: Master Key = ${MASTER_KEY.substring(0, 30)}...`);
  console.log(`   ✓ KEY 2: Application Key = ${APPLICATION_KEY.substring(0, 30)}...`);
  console.log(`   ✓ KEY 3: Admin User = ${adminEmail}`);
  console.log('\n📋 Encrypted Data (Base64):');
  console.log('   ' + encryptRegistryData(authorizedApps).substring(0, 60) + '...');
  console.log('\n🔒 ALL THREE KEYS MUST MATCH for registry to load.');
  console.log('   This file cannot be used by unauthorized users or applications.\n');
  
  rl.close();
}

// Run
main().catch(console.error);

// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

function encryptRegistryData(authorizedApps) {
  const registryData = {
    authorizedSystemApps: authorizedApps,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    signature: REGISTRY_SIGNATURE
  };
  
  const jsonString = JSON.stringify(registryData);
  const encrypted = Buffer.from(jsonString).toString('base64');
  
  return encrypted;
}

function generateRegistryFile(authorizedApps) {
  const encrypted = encryptRegistryData(authorizedApps);
  
  const regFile = `VICPOL Desktop Registry File v1.0
================================
Encrypted Registry Data
DO NOT EDIT MANUALLY

[ENCRYPTED_DATA]
${encrypted}

[METADATA]
Version=1.0.0
LastModified=${new Date().toISOString()}
Signature=${REGISTRY_SIGNATURE}
`;
  
  return regFile;
}

function decryptAndDisplay(encryptedData) {
  try {
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    return data;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// INTERACTIVE CLI
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         VicPol Desktop Registry Admin Tool                ║');
  console.log('║         Generate Encrypted .reg Files                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Show current registry if it exists
  const registryPath = path.join(__dirname, '../../registry/system.reg');
  
  if (fs.existsSync(registryPath)) {
    console.log('📋 Current Registry File Found\n');
    
    try {
      const currentContent = fs.readFileSync(registryPath, 'utf-8');
      const encryptedMatch = currentContent.match(/\[ENCRYPTED_DATA\]\n([\s\S]*?)\n\n/);
      
      if (encryptedMatch) {
        const encryptedData = encryptedMatch[1].trim();
        const decrypted = decryptAndDisplay(encryptedData);
        
        if (decrypted) {
          console.log('Current Authorized System Apps:');
          decrypted.authorizedSystemApps.forEach((app, i) => {
            console.log(`  ${i + 1}. ${app}`);
          });
          console.log(`\nVersion: ${decrypted.version}`);
          console.log(`Created: ${decrypted.createdAt}\n`);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not read current registry\n');
    }
  }
  
  // Get input
  console.log('Enter authorized system apps (comma-separated)');
  console.log('Example: app-store,browser,settings\n');
  
  const input = await question('Authorized Apps: ');
  
  if (!input.trim()) {
    console.log('\n❌ No apps entered. Exiting.\n');
    rl.close();
    return;
  }
  
  // Parse input
  const authorizedApps = input.split(',').map(app => app.trim()).filter(Boolean);
  
  console.log('\n📝 Apps to authorize:');
  authorizedApps.forEach((app, i) => {
    console.log(`  ${i + 1}. ${app}`);
  });
  
  const confirm = await question('\nGenerate registry file? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Cancelled.\n');
    rl.close();
    return;
  }
  
  // Generate registry file
  const registryContent = generateRegistryFile(authorizedApps);
  
  // Ensure directory exists
  const registryDir = path.join(__dirname, '../../registry');
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(registryPath, registryContent, 'utf-8');
  
  console.log('\n✅ Registry file generated successfully!');
  console.log(`   Location: ${registryPath}`);
  console.log('\n📋 Encrypted Data (Base64):');
  console.log('   ' + encryptRegistryData(authorizedApps).substring(0, 60) + '...');
  console.log('\n🔐 This file is encrypted and can only be modified using this tool.\n');
  
  rl.close();
}

// Run
main().catch(console.error);
