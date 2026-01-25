#!/usr/bin/env node

/**
 * ============================================================================
 * INITIALIZE ROLES IN FIRESTORE
 * ============================================================================
 * This script creates the initial roles in Firestore
 * 
 * Usage:
 *   node initializeRoles.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define roles
const roles = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full system access and control',
    permissions: [
      'upload_apps',
      'manage_users',
      'manage_roles',
      'manage_departments',
      'all_access',
      'view_analytics',
      'system_settings'
    ],
    level: 100
  },
  {
    id: 'fto',
    name: 'Field Training Officer',
    description: 'Training and supervision access',
    permissions: [
      'manage_training',
      'view_reports',
      'approve_documents',
      'view_user_data'
    ],
    level: 50
  },
  {
    id: 'user',
    name: 'User',
    description: 'Basic user access',
    permissions: [
      'basic_access',
      'use_apps',
      'edit_profile'
    ],
    level: 1
  }
];

async function initializeRoles() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     Initialize Roles in Firestore         ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  try {
    for (const role of roles) {
      console.log(`Creating role: ${role.name} (${role.id})`);
      
      const roleRef = doc(db, 'roles', role.id);
      await setDoc(roleRef, {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        level: role.level,
        createdAt: new Date().toISOString()
      });
      
      console.log(`  ✅ ${role.name} created`);
      console.log(`     Permissions: ${role.permissions.join(', ')}`);
      console.log(`     Level: ${role.level}\n`);
    }
    
    console.log('✅ All roles initialized successfully!\n');
    console.log('Roles created:');
    roles.forEach(role => {
      console.log(`  - ${role.name} (level ${role.level})`);
    });
    
    console.log('\n📝 Next steps:');
    console.log('1. Update user documents to include roleId field');
    console.log('2. Set your user roleId to "owner"');
    console.log('3. Other users default to "user"\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing roles:', error);
    process.exit(1);
  }
}

// Run
initializeRoles();
