#!/usr/bin/env node

/**
 * ============================================================================
 * INITIALIZE DEPARTMENTS IN FIRESTORE
 * ============================================================================
 * This script creates the initial departments in Firestore
 * 
 * Usage:
 *   node initializeDepartments.js
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

// Define departments
const departments = [
  {
    id: 'administration',
    name: 'Administration',
    description: 'Administrative staff and management',
    color: '#007AFF'
  },
  {
    id: 'patrol',
    name: 'Patrol Division',
    description: 'Patrol officers and field units',
    color: '#34C759'
  },
  {
    id: 'investigations',
    name: 'Investigations',
    description: 'Detective and investigative units',
    color: '#FF9500'
  },
  {
    id: 'training',
    name: 'Training Division',
    description: 'Training and professional development',
    color: '#AF52DE'
  },
  {
    id: 'communications',
    name: 'Communications',
    description: 'Dispatch and communications center',
    color: '#FF2D55'
  },
  {
    id: 'all',
    name: 'All Departments',
    description: 'Content available to all departments',
    color: '#8E8E93'
  }
];

async function initializeDepartments() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Initialize Departments in Firestore     ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  try {
    for (const dept of departments) {
      console.log(`Creating department: ${dept.name} (${dept.id})`);
      
      const deptRef = doc(db, 'departments', dept.id);
      await setDoc(deptRef, {
        name: dept.name,
        description: dept.description,
        color: dept.color,
        createdAt: new Date().toISOString()
      });
      
      console.log(`  ✅ ${dept.name} created`);
    }
    
    console.log('\n✅ All departments initialized successfully!\n');
    console.log('Departments created:');
    departments.forEach(dept => {
      console.log(`  - ${dept.name}`);
    });
    
    console.log('\n📝 Next steps:');
    console.log('1. Update user documents to include department field');
    console.log('2. Set users to their appropriate departments');
    console.log('3. Install Learning Center app from App Store\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing departments:', error);
    process.exit(1);
  }
}

// Run
initializeDepartments();
