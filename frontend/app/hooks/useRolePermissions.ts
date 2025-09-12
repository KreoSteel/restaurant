import { useQuery } from '@tanstack/react-query';
import { useEmployeeProfile } from './useGeneralQueries';
import { createPermissionContext, hasPermission } from '../utils/permissions';
import type { UserPermissions, PermissionContext } from '../types/schedule';

// Helper function to get role name by ID (same as other pages)
function getRoleName(roleId: number): string {
  const roleNames: Record<number, string> = {
    1: 'Restaurant Manager',
    2: 'Assistant Manager',
    3: 'Head Chef',
    4: 'Sous Chef',
    5: 'Line Cook',
    6: 'Pastry Chef',
    7: 'Prep Cook',
    8: 'Dishwasher',
    9: 'Waiter/Waitress',
    10: 'Host/Hostess',
    11: 'Bartender',
    12: 'Barback',
    13: 'Cashier',
    14: 'Cleaner',
    15: 'Sommelier',
    16: 'Food Runner',
    17: 'Busser',
    18: 'Delivery Driver',
    19: 'Security Guard',
    20: 'Maintenance',
    21: 'Manager'
  };
  return roleNames[roleId] || 'Unknown';
}

export const useRolePermissions = () => {
  const { data: profile, isLoading, error } = useEmployeeProfile();

  const roleName = profile?.role_id ? getRoleName(profile.role_id) : 'Unknown';

  const permissions: UserPermissions | null = profile?.role_id ? 
    createPermissionContext(roleName, profile.role_id).permissions : null;

  const isAdmin = profile?.role_id ? 
    createPermissionContext(roleName, profile.role_id).isAdmin : false;

  const canManageIngredients = isAdmin;

  const checkPermission = (permission: keyof UserPermissions): boolean => {
    if (!permissions) return false;
    return hasPermission(permissions, permission);
  };

  return {
    profile,
    permissions,
    isAdmin,
    canManageIngredients,
    checkPermission,
    isLoading,
    error,
  };
};
