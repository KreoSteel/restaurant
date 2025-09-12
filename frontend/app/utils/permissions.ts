import type { UserPermissions, PermissionContext } from '../types/schedule';

// Define role-based permissions
const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  'Restaurant Manager': {
    canViewSchedule: true,
    canEditSchedule: true,
    canAssignEmployees: true,
    canCreateShifts: true,
    canDeleteShifts: true,
    canViewAllLocations: true,
    canManageRoles: true,
  },
  'Assistant Manager': {
    canViewSchedule: true,
    canEditSchedule: true,
    canAssignEmployees: true,
    canCreateShifts: true,
    canDeleteShifts: false,
    canViewAllLocations: true,
    canManageRoles: false,
  },
  'Head Chef': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Sous Chef': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Line Cook': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Pastry Chef': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Prep Cook': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Dishwasher': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Waiter/Waitress': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Host/Hostess': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Bartender': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Barback': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Cashier': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Cleaner': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Sommelier': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Food Runner': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Busser': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Delivery Driver': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
  'Security Guard': {
    canViewSchedule: true,
    canEditSchedule: false,
    canAssignEmployees: false,
    canCreateShifts: false,
    canDeleteShifts: false,
    canViewAllLocations: false,
    canManageRoles: false,
  },
};

// Default permissions for unknown roles
const DEFAULT_PERMISSIONS: UserPermissions = {
  canViewSchedule: false,
  canEditSchedule: false,
  canAssignEmployees: false,
  canCreateShifts: false,
  canDeleteShifts: false,
  canViewAllLocations: false,
  canManageRoles: false,
};

export function getPermissions(roleName: string): UserPermissions {
  return ROLE_PERMISSIONS[roleName] || DEFAULT_PERMISSIONS;
}

export function createPermissionContext(
  roleName: string,
  roleId: number
): PermissionContext {
  const permissions = getPermissions(roleName);
  const isAdmin = roleName === 'Restaurant Manager' || roleName === 'Assistant Manager';

  return {
    userRole: roleName,
    userRoleId: roleId,
    permissions,
    isAdmin,
  };
}

export function hasPermission(
  permissions: UserPermissions,
  permission: keyof UserPermissions
): boolean {
  return permissions[permission] === true;
}

export function canAccessLocation(
  permissions: UserPermissions,
  userLocationId: number,
  targetLocationId: number
): boolean {
  if (permissions.canViewAllLocations) {
    return true;
  }
  return userLocationId === targetLocationId;
}

export function getAccessDeniedMessage(permission: keyof UserPermissions): string {
  const messages: Record<keyof UserPermissions, string> = {
    canViewSchedule: 'You do not have permission to view schedules.',
    canEditSchedule: 'You do not have permission to edit schedules.',
    canAssignEmployees: 'You do not have permission to assign employees.',
    canCreateShifts: 'You do not have permission to create shifts.',
    canDeleteShifts: 'You do not have permission to delete shifts.',
    canViewAllLocations: 'You do not have permission to view all locations.',
    canManageRoles: 'You do not have permission to manage roles.',
  };
  
  return messages[permission];
}
