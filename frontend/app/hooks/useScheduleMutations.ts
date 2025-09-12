import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../services/scheduleApi';
import { scheduleKeys } from './useScheduleQueries';
import type { 
  CreateShiftRequest, 
  AssignEmployeeRequest, 
  UnassignEmployeeRequest 
} from '../types/schedule';

// Optimistic Updates for Schedule Mutations
export const useScheduleMutations = () => {
  const queryClient = useQueryClient();

  // Create Shift with Optimistic Update
  const createShiftMutation = useMutation({
    mutationFn: (shiftData: CreateShiftRequest) => scheduleApi.createShift(shiftData),
    onMutate: async (newShift) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: scheduleKeys.shifts() });

      // Snapshot the previous value
      const previousShifts = queryClient.getQueryData(scheduleKeys.shifts());

      // Optimistically update to the new value
      queryClient.setQueryData(scheduleKeys.shifts(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [...(old.data || []), { ...newShift, id: Date.now() }] // Temporary ID
        };
      });

      // Return a context object with the snapshotted value
      return { previousShifts };
    },
    onError: (err, newShift, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousShifts) {
        queryClient.setQueryData(scheduleKeys.shifts(), context.previousShifts);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
    },
  });

  // Assign Employee with Optimistic Update
  const assignEmployeeMutation = useMutation({
    mutationFn: (assignmentData: AssignEmployeeRequest) => scheduleApi.assignEmployee(assignmentData),
    onMutate: async (newAssignment) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.assignments() });
      
      const previousAssignments = queryClient.getQueryData(scheduleKeys.assignments());
      
      queryClient.setQueryData(scheduleKeys.assignments(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [...(old.data || []), { ...newAssignment, id: Date.now() }]
        };
      });

      return { previousAssignments };
    },
    onError: (err, newAssignment, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(scheduleKeys.assignments(), context.previousAssignments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.employeeSchedules() });
    },
  });

  // Unassign Employee with Optimistic Update
  const unassignEmployeeMutation = useMutation({
    mutationFn: (unassignData: UnassignEmployeeRequest) => scheduleApi.unassignEmployee(unassignData),
    onMutate: async (unassignData) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.assignments() });
      
      const previousAssignments = queryClient.getQueryData(scheduleKeys.assignments());
      
      queryClient.setQueryData(scheduleKeys.assignments(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).filter((assignment: any) => 
            !(assignment.employee_id === unassignData.employee_id && 
              assignment.shift_date === unassignData.shift_date)
          )
        };
      });

      return { previousAssignments };
    },
    onError: (err, unassignData, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(scheduleKeys.assignments(), context.previousAssignments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.assignments() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.employeeSchedules() });
    },
  });

  return {
    createShift: createShiftMutation,
    assignEmployee: assignEmployeeMutation,
    unassignEmployee: unassignEmployeeMutation,
  };
};
