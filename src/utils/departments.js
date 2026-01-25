// ============================================================================
// DEPARTMENTS SYSTEM
// ============================================================================
// Manages departments and department-based access

import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Cache departments to avoid repeated Firestore calls
let departmentsCache = null;

/**
 * Default departments for VicPol
 */
export const DEFAULT_DEPARTMENTS = [
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

/**
 * Load all departments from Firestore
 */
export async function loadDepartments() {
  if (departmentsCache) return departmentsCache;
  
  try {
    const deptSnapshot = await getDocs(collection(db, 'departments'));
    const departments = [];
    
    deptSnapshot.forEach(doc => {
      departments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // If no departments in Firestore, use defaults
    if (departments.length === 0) {
      departmentsCache = DEFAULT_DEPARTMENTS;
      return DEFAULT_DEPARTMENTS;
    }
    
    departmentsCache = departments;
    return departments;
  } catch (error) {
    console.error('Failed to load departments:', error);
    return DEFAULT_DEPARTMENTS;
  }
}

/**
 * Get user's department
 */
export async function getUserDepartment(user) {
  if (!user || !user.uid) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    return userData.department || null;
  } catch (error) {
    console.error('Failed to get user department:', error);
    return null;
  }
}

/**
 * Get department by ID
 */
export async function getDepartmentById(deptId) {
  const departments = await loadDepartments();
  return departments.find(d => d.id === deptId);
}

/**
 * Get department name
 */
export function getDepartmentName(deptId) {
  const dept = DEFAULT_DEPARTMENTS.find(d => d.id === deptId);
  return dept ? dept.name : deptId;
}

/**
 * Check if user has access to department content
 */
export async function hasAccessToDepartment(user, targetDeptId) {
  if (!user) return false;
  
  // 'all' department is accessible to everyone
  if (targetDeptId === 'all') return true;
  
  const userDept = await getUserDepartment(user);
  
  // User's own department
  if (userDept === targetDeptId) return true;
  
  // Check if user is owner (has access to all)
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    if (userData.roleId === 'owner') return true;
  }
  
  return false;
}

/**
 * Get departments user can access
 */
export async function getUserAccessibleDepartments(user) {
  if (!user) return ['all'];
  
  const departments = await loadDepartments();
  const userDept = await getUserDepartment(user);
  
  // Check if owner
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const isOwner = userDoc.exists() && userDoc.data().roleId === 'owner';
  
  if (isOwner) {
    // Owner can access all departments
    return departments.map(d => d.id);
  }
  
  // Regular users can access their department + 'all'
  const accessible = ['all'];
  if (userDept) {
    accessible.push(userDept);
  }
  
  return accessible;
}

/**
 * Clear departments cache
 */
export function clearDepartmentsCache() {
  departmentsCache = null;
}
