// ============================================================================
// ROLES & PERMISSIONS SYSTEM
// ============================================================================
// Manages user roles and permissions from Firestore

import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Cache roles to avoid repeated Firestore calls
let rolesCache = null;

/**
 * Load all roles from Firestore
 */
export async function loadRoles() {
  if (rolesCache) return rolesCache;
  
  try {
    const rolesSnapshot = await getDocs(collection(db, 'roles'));
    const roles = {};
    
    rolesSnapshot.forEach(doc => {
      roles[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    rolesCache = roles;
    return roles;
  } catch (error) {
    console.error('Failed to load roles:', error);
    return {};
  }
}

/**
 * Get user's role from Firestore
 */
export async function getUserRole(user) {
  if (!user || !user.uid) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    const roleId = userData.roleId || 'user'; // Default to 'user' role
    
    // Get role details
    const roles = await loadRoles();
    return roles[roleId] || roles['user'];
  } catch (error) {
    console.error('Failed to get user role:', error);
    return null;
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(user, permission) {
  const role = await getUserRole(user);
  
  if (!role) return false;
  
  // Owner has all permissions
  if (role.id === 'owner') return true;
  
  // Check if role has the permission
  return role.permissions && role.permissions.includes(permission);
}

/**
 * Check if user is owner
 */
export async function isOwner(user) {
  const role = await getUserRole(user);
  return role && role.id === 'owner';
}

/**
 * Check if user has minimum role level
 */
export async function hasMinimumLevel(user, minLevel) {
  const role = await getUserRole(user);
  
  if (!role) return false;
  
  return role.level >= minLevel;
}

/**
 * Get role display name
 */
export function getRoleName(roleId) {
  const roleNames = {
    'owner': 'Owner',
    'fto': 'Field Training Officer',
    'user': 'User'
  };
  
  return roleNames[roleId] || 'User';
}

/**
 * Clear roles cache (call when roles are updated)
 */
export function clearRolesCache() {
  rolesCache = null;
}
