import supabase from "../utils/supabase";
import { 
  Shift, 
  EmployeeSchedule, 
  ScheduleAssignment, 
  CreateShiftRequest, 
  AssignEmployeeRequest, 
  UnassignEmployeeRequest,
  ScheduleFilters 
} from "../types/schedule";

export async function getShifts(filters?: ScheduleFilters): Promise<{ data: Shift[], error: any }> {
  try {
    let query = supabase.from('shifts').select('*');
    
    if (filters?.start_date) {
      query = query.gte('"shift_Date"', filters.start_date);
    }
    
    if (filters?.end_date) {
      query = query.lte('"shift_Date"', filters.end_date);
    }
    
    const { data, error } = await query.order('"shift_Date"', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return { data: data as Shift[], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function getShiftByDate(date: string): Promise<{ data: Shift | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('"shift_Date"', date)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return { data: data as Shift || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createShift(shiftData: CreateShiftRequest): Promise<{ data: Shift, error: any }> {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        "shift_Date": shiftData.shift_date,
        admin_id: shiftData.admin_id,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: data as Shift, error: null };
  } catch (error) {
    return { data: null as any, error };
  }
}

export async function updateShift(date: string, shiftData: Partial<Shift>): Promise<{ data: Shift, error: any }> {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        ...shiftData,
        updated_at: new Date().toISOString()
      })
      .eq('"shift_Date"', date)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: data as Shift, error: null };
  } catch (error) {
    return { data: null as any, error };
  }
}

export async function deleteShift(date: string): Promise<{ data: Shift, error: any }> {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .delete()
      .eq('"shift_Date"', date)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: data as Shift, error: null };
  } catch (error) {
    return { data: null as any, error };
  }
}

export async function getEmployeeSchedules(filters?: ScheduleFilters): Promise<{ data: EmployeeSchedule[], error: any }> {
  try {
    let query = supabase.from('employees_schedule').select('*');
    
    if (filters?.start_date) {
      query = query.gte('shift_date', filters.start_date);
    }
    
    if (filters?.end_date) {
      query = query.lte('shift_date', filters.end_date);
    }
    
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    
    // Note: role_id filtering is handled in getScheduleAssignments instead
    // since employees_schedule doesn't have role_id directl
    
    const { data, error } = await query.order('shift_date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return { data: data as EmployeeSchedule[], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function getScheduleAssignments(filters?: ScheduleFilters): Promise<{ data: ScheduleAssignment[], error: any }> {
  try {
    let query = supabase
      .from('employees_schedule')
      .select(`
        shift_date,
        location_id,
        employee_id,
        employees!inner(role_id)
      `);
    
    if (filters?.start_date) {
      query = query.gte('shift_date', filters.start_date);
    }
    
    if (filters?.end_date) {
      query = query.lte('shift_date', filters.end_date);
    }
    
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    
    const { data, error } = await query.order('shift_date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Transform the data to match ScheduleAssignment interface
    let assignments: ScheduleAssignment[] = data.map((item: any) => ({
      shift_date: item.shift_date,
      location_id: item.location_id,
      employee_id: item.employee_id,
      role_id: item.employees.role_id
    }));
    
    // Filter by role_id after getting the data (since Supabase join filtering is complex)
    if (filters?.role_id) {
      assignments = assignments.filter(assignment => assignment.role_id === filters.role_id);
    }
    
    return { data: assignments, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function assignEmployee(assignmentData: AssignEmployeeRequest): Promise<{ data: EmployeeSchedule, error: any }> {
  try {
    // First, check if shift exists for this date
    const { data: shift, error: shiftError } = await getShiftByDate(assignmentData.shift_date);
    
    if (shiftError) {
      throw shiftError;
    }
    
    if (!shift) {
      throw new Error('Shift does not exist for this date');
    }
    
    // Check if employee is already assigned on this date
    const { data: existingAssignment, error: checkError } = await supabase
      .from('employees_schedule')
      .select('*')
      .eq('shift_date', assignmentData.shift_date)
      .eq('employee_id', assignmentData.employee_id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    if (existingAssignment) {
      throw new Error('Employee is already assigned on this date');
    }
    
    // Create the assignment
    const { data, error } = await supabase
      .from('employees_schedule')
      .insert({
        shift_date: assignmentData.shift_date,
        location_id: assignmentData.location_id,
        employee_id: assignmentData.employee_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: data as EmployeeSchedule, error: null };
  } catch (error) {
    return { data: null as any, error };
  }
}

export async function unassignEmployee(unassignData: UnassignEmployeeRequest): Promise<{ data: EmployeeSchedule, error: any }> {
  try {
    const { data, error } = await supabase
      .from('employees_schedule')
      .delete()
      .eq('shift_date', unassignData.shift_date)
      .eq('location_id', unassignData.location_id)
      .eq('employee_id', unassignData.employee_id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data: data as EmployeeSchedule, error: null };
  } catch (error) {
    return { data: null as any, error };
  }
}

export async function getEmployeesByRole(roleId: number, locationId?: number): Promise<{ data: any[], error: any }> {
  try {
    let query = supabase
      .from('employees')
      .select(`
        uuid,
        full_name,
        role_id,
        location_id,
        is_featured,
        role!inner(name)
      `)
      .eq('role_id', roleId)
      .eq('is_featured', true);
    
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function getScheduleValidation(
  startDate: string,
  endDate: string,
  locationId?: number
): Promise<{ data: any, error: any }> {
  try {
    // Get all assignments in the date range
    const { data: assignments, error: assignmentsError } = await getScheduleAssignments({
      start_date: startDate,
      end_date: endDate,
      location_id: locationId
    });
    
    if (assignmentsError) {
      throw assignmentsError;
    }
    
    // Get all employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        uuid,
        full_name,
        role_id,
        location_id,
        role!inner(name)
      `)
      .eq('is_featured', true);
    
    if (employeesError) {
      throw employeesError;
    }
    
    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('role')
      .select('*');
    
    if (rolesError) {
      throw rolesError;
    }
    
    // Group assignments by date
    const assignmentsByDate = new Map<string, ScheduleAssignment[]>();
    assignments.forEach(assignment => {
      if (!assignmentsByDate.has(assignment.shift_date)) {
        assignmentsByDate.set(assignment.shift_date, []);
      }
      assignmentsByDate.get(assignment.shift_date)!.push(assignment);
    });
    
    // Validate each day
    const validationResults = Array.from(assignmentsByDate.entries()).map(([date, dayAssignments]) => {
      // This would need the validation logic from the frontend
      // For now, return basic structure
      return {
        date,
        assignments: dayAssignments,
        isComplete: dayAssignments.length > 0,
        missingRoles: [],
        conflicts: []
      };
    });
    
    return { data: validationResults, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
