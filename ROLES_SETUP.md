# Roles & Permissions Setup Guide

## Overview

VicPol Desktop now has a role-based permissions system. Users are assigned roles that determine what they can do in the application.

## Default Roles

### 1. Owner
- **Level:** 100
- **Permissions:** Everything
  - Upload apps
  - Manage users  
  - Manage roles
  - Manage departments
  - All access
  - View analytics
  - System settings

### 2. FTO (Field Training Officer)
- **Level:** 50
- **Permissions:**
  - Manage training
  - View reports
  - Approve documents
  - View user data

### 3. User
- **Level:** 1
- **Permissions:**
  - Basic access
  - Use apps
  - Edit profile

---

## Firestore Structure

### Collections Created:

#### `roles` Collection:
```
roles/
├── owner/
│   ├── name: "Owner"
│   ├── permissions: ["upload_apps", "manage_users", ...]
│   └── level: 100
│
├── fto/
│   ├── name: "Field Training Officer"
│   ├── permissions: ["manage_training", "view_reports", ...]
│   └── level: 50
│
└── user/
    ├── name: "User"
    ├── permissions: ["basic_access", "use_apps", ...]
    └── level: 1
```

#### `users` Collection (Updated):
```
users/
└── {uid}/
    ├── email: "user@bluebird.live"
    ├── username: "username"
    ├── fullName: "Full Name"
    ├── roleId: "owner"          ← NEW FIELD
    ├── department: "Admin"       ← Optional
    └── installedApps: [...]
```

---

## Setup Steps

### Step 1: Initialize Roles in Firestore

**Option A: Using Script (Recommended)**

```bash
cd scripts
node initializeRoles.js
```

**Option B: Manual (Firestore Console)**

1. Go to Firebase Console → Firestore
2. Create collection: `roles`
3. Add documents:

**Document ID: `owner`**
```json
{
  "name": "Owner",
  "description": "Full system access and control",
  "permissions": [
    "upload_apps",
    "manage_users",
    "manage_roles",
    "manage_departments",
    "all_access",
    "view_analytics",
    "system_settings"
  ],
  "level": 100,
  "createdAt": "2026-01-24T00:00:00Z"
}
```

**Document ID: `fto`**
```json
{
  "name": "Field Training Officer",
  "description": "Training and supervision access",
  "permissions": [
    "manage_training",
    "view_reports",
    "approve_documents",
    "view_user_data"
  ],
  "level": 50,
  "createdAt": "2026-01-24T00:00:00Z"
}
```

**Document ID: `user`**
```json
{
  "name": "User",
  "description": "Basic user access",
  "permissions": [
    "basic_access",
    "use_apps",
    "edit_profile"
  ],
  "level": 1,
  "createdAt": "2026-01-24T00:00:00Z"
}
```

---

### Step 2: Assign Role to Your Account

Go to Firestore → `users` → Your UID document

Add field:
```
roleId: "owner"
```

**Example:**
```
users/lMuDB5SnsoaMfMOAHJPhGixhtuv2/
├── email: "sian.snow-cow@bluebird.live"
├── username: "sian.snow-cow"
├── fullName: "Sian Snow-Cow"
├── roleId: "owner"                        ← Add this!
└── installedApps: [...]
```

---

### Step 3: Test Upload Feature

1. Log in as owner
2. Open App Store
3. You should see "📤 Upload" button in header
4. Click it to upload .zip and/or .reg files

---

## How Roles Work

### Permission Check:

```javascript
import { hasPermission, isOwner } from './utils/roles';

// Check specific permission
const canUpload = await hasPermission(user, 'upload_apps');

// Check if owner
const isUserOwner = await isOwner(user);

// Check minimum level
const canApprove = await hasMinimumLevel(user, 50);
```

### In Components:

```javascript
// App Store - Upload button
{userIsOwner && (
  <button onClick={handleUpload}>
    Upload Apps
  </button>
)}
```

---

## Upload Functionality (Owner Only)

### What Owner Can Upload:

**App Files (.zip)**
- Contains app source code
- Must have config.json
- Extracted to /applications/

**Registry File (.reg)**
- Contains app list
- Encrypted
- Defines which apps appear

### Upload Flow:

```
1. Owner clicks "Upload" button
2. Selects .zip and/or .reg files
3. Clicks "Upload Files"
4. System processes:
   - .zip → Extract to /applications/
   - .reg → Replace /registry/apps.reg
5. Page reloads
6. New apps appear!
```

---

## Adding New Roles

### Via Firestore Console:

1. Go to `roles` collection
2. Add new document

**Example: Add "Supervisor" role**

Document ID: `supervisor`
```json
{
  "name": "Supervisor",
  "description": "Department supervisor access",
  "permissions": [
    "manage_department",
    "view_reports",
    "approve_requests"
  ],
  "level": 75,
  "createdAt": "2026-01-24T00:00:00Z"
}
```

---

## Assigning Roles to Users

### Method 1: Manually in Firestore

1. Go to `users` collection
2. Find user document
3. Set `roleId` field to role ID

### Method 2: Via Code (Future Feature)

```javascript
// Admin panel
async function assignRole(userId, roleId) {
  await updateDoc(doc(db, 'users', userId), {
    roleId: roleId
  });
}
```

---

## Department-Based Roles

Users can have both role and department:

```
users/{uid}/
├── roleId: "fto"
├── department: "Training Division"
└── ...
```

This allows for:
- Role-based permissions (what they can do)
- Department-based filtering (what they can see)

---

## Security Rules (Recommended)

Update Firestore rules to protect roles:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Roles - read only, only owner can write
    match /roles/{roleId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == 'owner';
    }
    
    // Users - can read own, only owner can write others
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == 'owner';
    }
  }
}
```

---

## Troubleshooting

### Upload Button Not Showing

**Check:**
1. Is user logged in?
2. Does user have `roleId: "owner"` in Firestore?
3. Is `roles/owner` document in Firestore?

**Console:**
```javascript
// In browser console
console.log(user); // Check user object
```

### Permission Denied

**Check:**
1. Firestore rules allow reading roles
2. User document has valid roleId
3. Role document exists

---

## Summary

✅ **3 Default Roles:** Owner, FTO, User
✅ **Permission-Based:** Each role has specific permissions
✅ **Level-Based:** Hierarchical access (1-100)
✅ **Upload Feature:** Owner can upload apps via App Store
✅ **Flexible:** Easy to add new roles
✅ **Secure:** Role checks on both frontend and backend

**Your account (sian.snow-cow@bluebird.live) should be set to "owner" role!**
