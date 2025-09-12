export interface Shift {
  shift_Date: string; // date format
  profit?: number;
  started_at: string; // timestamptz
  updated_at?: string; // timestamp
  admin_id?: string; // uuid
}

export interface EmployeeSchedule {
  shift_date: string; // date format
  created_at: string; // timestamptz
  updated_at?: string; // timestamp
  location_id?: number;
  employee_id?: string; // uuid
}

export interface ScheduleAssignment {
  shift_date: string;
  location_id: number;
  employee_id: string;
  role_id: number;
}

export interface ScheduleValidation {
  isComplete: boolean;
  missingRoles: number[];
  conflicts: ScheduleConflict[];
  completenessPercentage: number;
}

export interface ScheduleConflict {
  type: 'double_booking' | 'role_mismatch' | 'location_mismatch';
  employee_id: string;
  shift_date: string;
  message: string;
}

export interface RoleRequirement {
  role_id: number;
  role_name: string;
  required: boolean;
  assigned: boolean;
  assigned_employee_id?: string;
  assigned_employee_name?: string;
}

export interface ScheduleDay {
  date: string;
  location_id: number;
  location_name: string;
  role_requirements: RoleRequirement[];
  assignments: ScheduleAssignment[];
  validation: ScheduleValidation;
}

export interface ScheduleWeek {
  start_date: string;
  end_date: string;
  days: ScheduleDay[];
  overall_completeness: number;
}

export interface CreateShiftRequest {
  shift_date: string;
  location_id: number;
  admin_id?: string;
}

export interface AssignEmployeeRequest {
  shift_date: string;
  location_id: number;
  employee_id: string;
}

export interface UnassignEmployeeRequest {
  shift_date: string;
  location_id: number;
  employee_id: string;
}

export interface ScheduleFilters {
  location_id?: number;
  start_date?: string;
  end_date?: string;
  role_id?: number;
}

// Permission types
export interface UserPermissions {
  canViewSchedule: boolean;
  canEditSchedule: boolean;
  canAssignEmployees: boolean;
  canCreateShifts: boolean;
  canDeleteShifts: boolean;
  canViewAllLocations: boolean;
  canManageRoles: boolean;
}

export interface PermissionContext {
  userRole: string;
  userRoleId: number;
  permissions: UserPermissions;
  isAdmin: boolean;
}
