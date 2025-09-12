import type { 
  ScheduleDay, 
  ScheduleAssignment, 
  ScheduleValidation, 
  ScheduleConflict, 
  RoleRequirement,
  ScheduleWeek
} from '../types/schedule';
import type Employee from '../types/employee';
import type Role from '../types/roles';

// Define which roles are required for each shift
const REQUIRED_ROLES = [
  { role_id: 1, name: 'Restaurant Manager', required: true }, // Manager
  { role_id: 2, name: 'Assistant Manager', required: false }, // Assistant Manager (optional)
  { role_id: 3, name: 'Head Chef', required: true }, // Head Chef
  { role_id: 4, name: 'Sous Chef', required: false }, // Sous Chef (optional)
  { role_id: 5, name: 'Line Cook', required: true }, // Line Cook
  { role_id: 6, name: 'Pastry Chef', required: false }, // Pastry Chef (optional)
  { role_id: 7, name: 'Prep Cook', required: true }, // Prep Cook
  { role_id: 8, name: 'Dishwasher', required: true }, // Dishwasher
  { role_id: 9, name: 'Waiter/Waitress', required: true }, // Waiter/Waitress
  { role_id: 10, name: 'Host/Hostess', required: true }, // Host/Hostess
  { role_id: 11, name: 'Bartender', required: false }, // Bartender (optional)
  { role_id: 12, name: 'Barback', required: false }, // Barback (optional)
  { role_id: 13, name: 'Cashier', required: true }, // Cashier
  { role_id: 14, name: 'Cleaner', required: true }, // Cleaner
  { role_id: 15, name: 'Sommelier', required: false }, // Sommelier (optional)
  { role_id: 16, name: 'Food Runner', required: false }, // Food Runner (optional)
  { role_id: 17, name: 'Busser', required: false }, // Busser (optional)
  { role_id: 18, name: 'Delivery Driver', required: false }, // Delivery Driver (optional)
  { role_id: 19, name: 'Security Guard', required: false }, // Security Guard (optional)
];

export function validateScheduleDay(
  day: ScheduleDay,
  allEmployees: Employee[],
  allRoles: Role[]
): ScheduleValidation {
  const conflicts: ScheduleConflict[] = [];
  const missingRoles: number[] = [];
  
  // Check for double bookings
  const employeeAssignments = new Map<string, number>();
  day.assignments.forEach(assignment => {
    const count = employeeAssignments.get(assignment.employee_id) || 0;
    employeeAssignments.set(assignment.employee_id, count + 1);
    
    if (count > 0) {
      const employee = allEmployees.find(emp => emp.uuid === assignment.employee_id);
      conflicts.push({
        type: 'double_booking',
        employee_id: assignment.employee_id,
        shift_date: day.date,
        message: `Employee ${employee?.full_name || assignment.employee_id} is assigned multiple times on ${day.date}`
      });
    }
  });

  // Check role requirements
  const assignedRoles = new Set(day.assignments.map(a => a.role_id));
  REQUIRED_ROLES.forEach(role => {
    if (role.required && !assignedRoles.has(role.role_id)) {
      missingRoles.push(role.role_id);
    }
  });

  // Check for role mismatches
  day.assignments.forEach(assignment => {
    const employee = allEmployees.find(emp => emp.uuid === assignment.employee_id);
    if (employee && employee.role_id !== assignment.role_id) {
      const employeeRole = allRoles.find(r => r.id === employee.role_id);
      const assignedRole = allRoles.find(r => r.id === assignment.role_id);
      conflicts.push({
        type: 'role_mismatch',
        employee_id: assignment.employee_id,
        shift_date: day.date,
        message: `Employee ${employee.full_name} has role "${employeeRole?.name || 'Unknown'}" but assigned to "${assignedRole?.name || 'Unknown'}" role`
      });
    }
  });

  // Check for location mismatches
  day.assignments.forEach(assignment => {
    const employee = allEmployees.find(emp => emp.uuid === assignment.employee_id);
    if (employee && employee.location_id !== assignment.location_id) {
      conflicts.push({
        type: 'location_mismatch',
        employee_id: assignment.employee_id,
        shift_date: day.date,
        message: `Employee ${employee.full_name} is assigned to location ${assignment.location_id} but belongs to location ${employee.location_id}`
      });
    }
  });

  const totalRequiredRoles = REQUIRED_ROLES.filter(r => r.required).length;
  const assignedRequiredRoles = REQUIRED_ROLES.filter(r => r.required && assignedRoles.has(r.role_id)).length;
  const completenessPercentage = totalRequiredRoles > 0 ? (assignedRequiredRoles / totalRequiredRoles) * 100 : 100;

  return {
    isComplete: missingRoles.length === 0 && conflicts.length === 0,
    missingRoles,
    conflicts,
    completenessPercentage: Math.round(completenessPercentage)
  };
}

export function createRoleRequirements(
  assignments: ScheduleAssignment[],
  allRoles: Role[],
  allEmployees: Employee[]
): RoleRequirement[] {
  const assignedRoles = new Map<number, ScheduleAssignment>();
  assignments.forEach(assignment => {
    assignedRoles.set(assignment.role_id, assignment);
  });

  return REQUIRED_ROLES.map(role => {
    const assignment = assignedRoles.get(role.role_id);
    const employee = assignment ? allEmployees.find(emp => emp.uuid === assignment.employee_id) : null;
    
    return {
      role_id: role.role_id,
      role_name: role.name,
      required: role.required,
      assigned: !!assignment,
      assigned_employee_id: assignment?.employee_id,
      assigned_employee_name: employee?.full_name || undefined
    };
  });
}

export function validateScheduleWeek(
  week: ScheduleWeek,
  allEmployees: Employee[],
  allRoles: Role[]
): ScheduleValidation {
  const allConflicts: ScheduleConflict[] = [];
  const allMissingRoles: number[] = [];
  let totalCompleteness = 0;

  week.days.forEach(day => {
    const dayValidation = validateScheduleDay(day, allEmployees, allRoles);
    allConflicts.push(...dayValidation.conflicts);
    allMissingRoles.push(...dayValidation.missingRoles);
    totalCompleteness += dayValidation.completenessPercentage;
  });

  const averageCompleteness = week.days.length > 0 ? totalCompleteness / week.days.length : 0;

  return {
    isComplete: allConflicts.length === 0 && allMissingRoles.length === 0,
    missingRoles: [...new Set(allMissingRoles)],
    conflicts: allConflicts,
    completenessPercentage: Math.round(averageCompleteness)
  };
}

export function canAssignEmployee(
  employee: Employee,
  targetRoleId: number,
  targetLocationId: number,
  shiftDate: string,
  existingAssignments: ScheduleAssignment[]
): { canAssign: boolean; reason?: string } {
  // Check if employee is already assigned on this date
  const isAlreadyAssigned = existingAssignments.some(
    assignment => assignment.employee_id === employee.uuid && assignment.shift_date === shiftDate
  );

  if (isAlreadyAssigned) {
    return {
      canAssign: false,
      reason: 'Employee is already assigned on this date'
    };
  }

  // Check role mismatch
  if (employee.role_id !== targetRoleId) {
    return {
      canAssign: false,
      reason: 'Employee role does not match the required role'
    };
  }

  // Check location mismatch
  if (employee.location_id !== targetLocationId) {
    return {
      canAssign: false,
      reason: 'Employee location does not match the target location'
    };
  }

  return { canAssign: true };
}

export function getScheduleStatusColor(completenessPercentage: number): string {
  if (completenessPercentage === 100) return 'green';
  if (completenessPercentage >= 80) return 'yellow';
  if (completenessPercentage >= 50) return 'orange';
  return 'red';
}

export function getScheduleStatusText(completenessPercentage: number): string {
  if (completenessPercentage === 100) return 'Complete';
  if (completenessPercentage >= 80) return 'Nearly Complete';
  if (completenessPercentage >= 50) return 'Incomplete';
  return 'Critical';
}
