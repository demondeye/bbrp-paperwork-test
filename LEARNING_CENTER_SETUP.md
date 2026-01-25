# Learning Center & Departments Setup Guide

## Overview

The Learning Center is a department-based library system where users can access handbooks, policies, procedures, and training materials specific to their department.

---

## Features

### 📚 **Learning Center App**
- Department-based document library
- Upload handbooks, policies, procedures, training materials
- Search and filter documents
- Role-based upload permissions
- Document viewer

### 🏢 **Department System**
- 6 default departments
- Department-specific content
- Department filtering
- Cross-department "All" category

### 🔒 **Upload Permissions**
- **Owner:** Upload to any department
- **FTO:** Upload to their department only
- **User:** Read-only access

---

## Firestore Structure

### Collections:

#### 1. `departments`
```
departments/
├── administration/
│   ├── name: "Administration"
│   ├── description: "Administrative staff and management"
│   └── color: "#007AFF"
│
├── patrol/
│   ├── name: "Patrol Division"
│   ├── description: "Patrol officers and field units"
│   └── color: "#34C759"
│
├── investigations/
│   ├── name: "Investigations"
│   ├── description: "Detective and investigative units"
│   └── color: "#FF9500"
│
├── training/
│   ├── name: "Training Division"
│   ├── description: "Training and professional development"
│   └── color: "#AF52DE"
│
├── communications/
│   ├── name: "Communications"
│   ├── description: "Dispatch and communications center"
│   └── color: "#FF2D55"
│
└── all/
    ├── name: "All Departments"
    ├── description: "Content available to all departments"
    └── color: "#8E8E93"
```

#### 2. `users` (Updated)
```
users/{uid}/
├── email: "user@bluebird.live"
├── username: "username"
├── fullName: "Full Name"
├── roleId: "user"
├── department: "patrol"        ← NEW FIELD
└── installedApps: [...]
```

#### 3. `learning_center` (New)
```
learning_center/{docId}/
├── title: "Use of Force Policy"
├── department: "patrol"
├── category: "policy"
├── content: "Policy text..."
├── author: "John Doe"
├── authorUid: "uid123"
├── tags: ["force", "policy", "patrol"]
├── createdAt: "2026-01-24T00:00:00Z"
└── updatedAt: "2026-01-24T00:00:00Z"
```

---

## Setup Steps

### Step 1: Initialize Departments

**Option A: Using Script (Recommended)**

```bash
cd scripts
node initializeDepartments.js
```

**Option B: Manual (Firestore Console)**

1. Go to Firebase Console → Firestore
2. Create collection: `departments`
3. Add 6 documents (see structure above)

### Step 2: Assign Departments to Users

Go to Firestore → `users` → Select user

Add field:
```
department: "patrol"
```

**Departments:**
- `administration`
- `patrol`
- `investigations`
- `training`
- `communications`
- `all` (for owners/cross-department access)

**Example:**
```
users/lMuDB5SnsoaMfMOAHJPhGixhtuv2/
├── roleId: "owner"
├── department: "administration"  ← Add this
└── ...
```

### Step 3: Install Learning Center App

1. Log into app
2. Open App Store
3. Find "📚 Learning Center"
4. Click "GET" to install
5. App appears on desktop

---

## How It Works

### Department-Based Access

**User sees:**
- Documents from their department
- Documents marked "All Departments"
- **Cannot** see other department's documents

**Owner sees:**
- All documents from all departments
- Can upload to any department

**Example:**

User: `department: "patrol"`
```
✅ Patrol Division documents
✅ All Departments documents
❌ Investigations documents
❌ Training Division documents
```

Owner: `roleId: "owner"`
```
✅ All documents from all departments
✅ Can upload to any department
```

---

## Upload Permissions

### Owner
- Can upload to **any department**
- Can delete **any document**
- Sees upload button

### FTO (Field Training Officer)
- Can upload to **their department only**
- Can upload to **All Departments**
- Can delete **their own documents**
- Sees upload button

### User
- **Cannot upload**
- Can only read documents
- No upload button

---

## Using Learning Center

### As User (Read Only)

1. Open Learning Center
2. Browse documents
3. Use search bar to find specific docs
4. Filter by department dropdown
5. Click document to read full content

### As FTO (Upload to Own Department)

1. Open Learning Center
2. Click "📤 Upload Document"
3. Fill in form:
   - Title
   - Department (only yours or "all")
   - Category
   - Content
4. Click "Upload Document"
5. Document appears in library

### As Owner (Upload to Any Department)

1. Open Learning Center
2. Click "📤 Upload Document"
3. Select any department from dropdown
4. Upload document
5. All users in that department can see it

---

## Document Categories

Available categories:
- 📘 **Handbook** - Department handbooks
- 📋 **Policy** - Official policies
- 📝 **Procedure** - Standard operating procedures
- 🎓 **Training Material** - Training docs
- 📄 **Memo** - Departmental memos
- 📖 **Guide** - How-to guides
- 📑 **Form** - Official forms

---

## Example Documents

### For Patrol Division:

```
Title: "Use of Force Policy 2026"
Department: patrol
Category: policy
Content: [Policy text]
```

### For All Departments:

```
Title: "Employee Handbook"
Department: all
Category: handbook
Content: [Handbook text]
```

### For Training Division:

```
Title: "Field Training Officer Manual"
Department: training
Category: training
Content: [Manual text]
```

---

## Security Rules (Recommended)

Update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Departments - read only for all authenticated users
    match /departments/{deptId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == 'owner';
    }
    
    // Learning Center Documents
    match /learning_center/{docId} {
      // Read: if user's department matches OR doc is "all" OR user is owner
      allow read: if request.auth != null && (
        resource.data.department == 'all' ||
        resource.data.department == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.department ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == 'owner'
      );
      
      // Write: owner OR FTO uploading to their dept
      allow create: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == 'owner' ||
        (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == 'fto' &&
          (
            request.resource.data.department == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.department ||
            request.resource.data.department == 'all'
          )
        )
      );
      
      // Delete: owner or author
      allow delete: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == 'owner' ||
        resource.data.authorUid == request.auth.uid
      );
    }
  }
}
```

---

## Adding New Departments

### Via Firestore Console:

1. Go to `departments` collection
2. Add new document

**Example: Add "K9 Unit"**

Document ID: `k9-unit`
```json
{
  "name": "K9 Unit",
  "description": "Canine officers and handlers",
  "color": "#5856D6",
  "createdAt": "2026-01-24T00:00:00Z"
}
```

### Assign Users:

```
users/{uid}/
  department: "k9-unit"
```

---

## Troubleshooting

### Upload Button Not Showing

**Check:**
1. User has `roleId: "owner"` OR `roleId: "fto"`
2. User is logged in
3. Learning Center app is open

### Can't See Documents

**Check:**
1. User has `department` field set
2. Documents exist in Firestore
3. Documents have correct `department` field
4. Document department matches user's department or is "all"

### FTO Can't Upload

**Check:**
1. User has `roleId: "fto"`
2. User has `department` field
3. Trying to upload to their department or "all"

---

## User Setup Checklist

For each user, ensure they have:

```
users/{uid}/
├── ✅ email
├── ✅ username
├── ✅ fullName
├── ✅ roleId (user/fto/owner)
├── ✅ department (patrol/training/etc)
└── ✅ installedApps
```

---

## Summary

✅ **6 Departments** - Pre-configured and ready
✅ **Learning Center App** - Document library system
✅ **Department Filtering** - Users see relevant content
✅ **Role-Based Upload** - Owner/FTO can upload
✅ **Search & Filter** - Easy document discovery
✅ **Document Viewer** - Read full documents
✅ **Categories** - Organized by type

**Next Steps:**
1. Run `node scripts/initializeDepartments.js`
2. Set user departments in Firestore
3. Set user roles (owner/fto/user)
4. Install Learning Center from App Store
5. Upload first documents!

🎉 **Ready to build your department library!**
