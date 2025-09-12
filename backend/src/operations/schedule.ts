import { 
  getShifts, 
  getShiftByDate, 
  createShift, 
  updateShift, 
  deleteShift,
  getEmployeeSchedules,
  getScheduleAssignments,
  assignEmployee,
  unassignEmployee,
  getEmployeesByRole,
  getScheduleValidation
} from "../services/schedule";
import { 
  Shift, 
  EmployeeSchedule, 
  ScheduleAssignment, 
  CreateShiftRequest, 
  AssignEmployeeRequest, 
  UnassignEmployeeRequest,
  ScheduleFilters 
} from "../types/schedule";

export async function getShiftsOperation(filters?: ScheduleFilters): Promise<Shift[]> {
  const { data, error } = await getShifts(filters);
  if (error) {
    throw error;
  }
  return data;
}

export async function getShiftByDateOperation(date: string): Promise<Shift | null> {
  const { data, error } = await getShiftByDate(date);
  if (error) {
    throw error;
  }
  return data;
}

export async function createShiftOperation(shiftData: CreateShiftRequest): Promise<Shift> {
  const { data, error } = await createShift(shiftData);
  if (error) {
    throw error;
  }
  return data;
}

export async function updateShiftOperation(date: string, shiftData: Partial<Shift>): Promise<Shift> {
  const { data, error } = await updateShift(date, shiftData);
  if (error) {
    throw error;
  }
  return data;
}

export async function deleteShiftOperation(date: string): Promise<Shift> {
  const { data, error } = await deleteShift(date);
  if (error) {
    throw error;
  }
  return data;
}

export async function getEmployeeSchedulesOperation(filters?: ScheduleFilters): Promise<EmployeeSchedule[]> {
  const { data, error } = await getEmployeeSchedules(filters);
  if (error) {
    throw error;
  }
  return data;
}

export async function getScheduleAssignmentsOperation(filters?: ScheduleFilters): Promise<ScheduleAssignment[]> {
  const { data, error } = await getScheduleAssignments(filters);
  if (error) {
    throw error;
  }
  return data;
}

export async function assignEmployeeOperation(assignmentData: AssignEmployeeRequest): Promise<EmployeeSchedule> {
  const { data, error } = await assignEmployee(assignmentData);
  if (error) {
    throw error;
  }
  return data;
}

export async function unassignEmployeeOperation(unassignData: UnassignEmployeeRequest): Promise<EmployeeSchedule> {
  const { data, error } = await unassignEmployee(unassignData);
  if (error) {
    throw error;
  }
  return data;
}

export async function getEmployeesByRoleOperation(roleId: number, locationId?: number): Promise<any[]> {
  const { data, error } = await getEmployeesByRole(roleId, locationId);
  if (error) {
    throw error;
  }
  return data;
}

export async function getScheduleValidationOperation(
  startDate: string,
  endDate: string,
  locationId?: number
): Promise<any> {
  const { data, error } = await getScheduleValidation(startDate, endDate, locationId);
  if (error) {
    throw error;
  }
  return data;
}

