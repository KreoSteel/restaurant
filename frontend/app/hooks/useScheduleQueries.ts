import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../services/scheduleApi';
import type { 
  Shift, 
  EmployeeSchedule, 
  ScheduleAssignment, 
  CreateShiftRequest, 
  AssignEmployeeRequest, 
  UnassignEmployeeRequest,
  ScheduleFilters 
} from '../types/schedule';

// Query Keys
export const scheduleKeys = {
  all: ['schedule'] as const,
  shifts: () => [...scheduleKeys.all, 'shifts'] as const,
  shiftsList: (filters?: ScheduleFilters) => [...scheduleKeys.shifts(), 'list', filters] as const,
  shiftByDate: (date: string) => [...scheduleKeys.shifts(), 'byDate', date] as const,
  employeeSchedules: () => [...scheduleKeys.all, 'employeeSchedules'] as const,
  employeeSchedulesList: (filters?: ScheduleFilters) => [...scheduleKeys.employeeSchedules(), 'list', filters] as const,
  assignments: () => [...scheduleKeys.all, 'assignments'] as const,
  assignmentsList: (filters?: ScheduleFilters) => [...scheduleKeys.assignments(), 'list', filters] as const,
  employeesByRole: (roleId: number, locationId?: number) => [...scheduleKeys.all, 'employees', 'byRole', roleId, locationId] as const,
  validation: (startDate: string, endDate: string, locationId?: number) => [...scheduleKeys.all, 'validation', startDate, endDate, locationId] as const,
};

// Shifts Queries
export const useShifts = (filters?: ScheduleFilters) => {
  return useQuery({
    queryKey: scheduleKeys.shiftsList(filters),
    queryFn: () => scheduleApi.getShifts(filters),
    enabled: true,
  });
};

export const useShiftByDate = (date: string) => {
  return useQuery({
    queryKey: scheduleKeys.shiftByDate(date),
    queryFn: () => scheduleApi.getShiftByDate(date),
    enabled: !!date,
  });
};

// Employee Schedules Queries
export const useEmployeeSchedules = (filters?: ScheduleFilters) => {
  return useQuery({
    queryKey: scheduleKeys.employeeSchedulesList(filters),
    queryFn: () => scheduleApi.getEmployeeSchedules(filters),
    enabled: true,
  });
};

// Schedule Assignments Queries
export const useScheduleAssignments = (filters?: ScheduleFilters) => {
  return useQuery({
    queryKey: scheduleKeys.assignmentsList(filters),
    queryFn: () => scheduleApi.getScheduleAssignments(filters),
    enabled: true,
  });
};

// Employees by Role Query
export const useEmployeesByRole = (roleId: number, locationId?: number) => {
  return useQuery({
    queryKey: scheduleKeys.employeesByRole(roleId, locationId),
    queryFn: () => scheduleApi.getEmployeesByRole(roleId, locationId),
    enabled: !!roleId,
  });
};

// Schedule Validation Query
export const useScheduleValidation = (startDate: string, endDate: string, locationId?: number) => {
  return useQuery({
    queryKey: scheduleKeys.validation(startDate, endDate, locationId),
    queryFn: () => scheduleApi.getScheduleValidation(startDate, endDate, locationId),
    enabled: !!startDate && !!endDate,
  });
};

// Mutations
export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shiftData: CreateShiftRequest) => scheduleApi.createShift(shiftData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch shifts
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
      
      // Add the new shift to the cache
      queryClient.setQueryData(
        scheduleKeys.shiftByDate(variables.shift_date),
        data
      );
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, shiftData }: { date: string; shiftData: Partial<Shift> }) => 
      scheduleApi.updateShift(date, shiftData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch shifts
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
      
      // Update the specific shift in cache
      queryClient.setQueryData(
        scheduleKeys.shiftByDate(variables.date),
        data
      );
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => scheduleApi.deleteShift(date),
    onSuccess: (data, variables) => {
      // Invalidate and refetch shifts
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
      
      // Remove the shift from cache
      queryClient.removeQueries({ queryKey: scheduleKeys.shiftByDate(variables) });
    },
  });
};

export const useAssignEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentData: AssignEmployeeRequest) => scheduleApi.assignEmployee(assignmentData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch assignments and employee schedules
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.employeeSchedules() });
      
      // Invalidate shifts to refresh the schedule view
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
    },
  });
};

export const useUnassignEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (unassignData: UnassignEmployeeRequest) => scheduleApi.unassignEmployee(unassignData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch assignments and employee schedules
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.employeeSchedules() });
      
      // Invalidate shifts to refresh the schedule view
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
    },
  });
};

// Combined Schedule Data Hook
export const useScheduleData = (filters?: ScheduleFilters) => {
  const shiftsQuery = useShifts(filters);
  const assignmentsQuery = useScheduleAssignments(filters);
  const employeeSchedulesQuery = useEmployeeSchedules(filters);

  return {
    shifts: shiftsQuery.data?.data || [],
    assignments: assignmentsQuery.data?.data || [],
    employeeSchedules: employeeSchedulesQuery.data?.data || [],
    isLoading: shiftsQuery.isLoading || assignmentsQuery.isLoading || employeeSchedulesQuery.isLoading,
    isError: shiftsQuery.isError || assignmentsQuery.isError || employeeSchedulesQuery.isError,
    error: shiftsQuery.error || assignmentsQuery.error || employeeSchedulesQuery.error,
    refetch: () => {
      shiftsQuery.refetch();
      assignmentsQuery.refetch();
      employeeSchedulesQuery.refetch();
    },
  };
};

// Prefetch utilities
export const usePrefetchScheduleData = () => {
  const queryClient = useQueryClient();

  const prefetchScheduleData = (filters?: ScheduleFilters) => {
    queryClient.prefetchQuery({
      queryKey: scheduleKeys.shiftsList(filters),
      queryFn: () => scheduleApi.getShifts(filters),
    });
    
    queryClient.prefetchQuery({
      queryKey: scheduleKeys.assignmentsList(filters),
      queryFn: () => scheduleApi.getScheduleAssignments(filters),
    });
    
    queryClient.prefetchQuery({
      queryKey: scheduleKeys.employeeSchedulesList(filters),
      queryFn: () => scheduleApi.getEmployeeSchedules(filters),
    });
  };

  return { prefetchScheduleData };
};
