import { Request, Response } from "express";
import { 
  getShiftsOperation, 
  getShiftByDateOperation, 
  createShiftOperation, 
  updateShiftOperation, 
  deleteShiftOperation,
  getEmployeeSchedulesOperation,
  getScheduleAssignmentsOperation,
  assignEmployeeOperation,
  unassignEmployeeOperation,
  getEmployeesByRoleOperation,
  getScheduleValidationOperation
} from "../operations/schedule";
import { CreateShiftRequest, AssignEmployeeRequest, UnassignEmployeeRequest, ScheduleFilters } from "../types/schedule";

export const scheduleController = {
  // Get all shifts with optional filters
  getShifts: async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: ScheduleFilters = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        location_id: req.query.location_id ? parseInt(req.query.location_id as string) : undefined,
        role_id: req.query.role_id ? parseInt(req.query.role_id as string) : undefined,
      };

      const shifts = await getShiftsOperation(filters);
      
      res.status(200).json({ 
        message: "Shifts fetched successfully", 
        data: shifts 
      });
      
    } catch (error: any) {
      console.error('Error fetching shifts:', error);
      res.status(500).json({ 
        error: "Failed to fetch shifts",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Get shift by date
  getShiftByDate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      
      if (!date) {
        res.status(400).json({ 
          error: "Missing date parameter", 
          details: "Date is required" 
        });
        return;
      }

      const shift = await getShiftByDateOperation(date);
      
      if (!shift) {
        res.status(404).json({ 
          error: "Shift not found",
          details: `No shift found for date ${date}` 
        });
        return;
      }
      
      res.status(200).json({ 
        message: "Shift fetched successfully", 
        data: shift 
      });
      
    } catch (error: any) {
      console.error('Error fetching shift:', error);
      res.status(500).json({ 
        error: "Failed to fetch shift",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Create a new shift
  createShift: async (req: Request, res: Response): Promise<void> => {
    try {
      const { shift_date, location_id, admin_id } = req.body as CreateShiftRequest;
      
      // Validate required fields
      if (!shift_date || !location_id) {
        res.status(400).json({ 
          error: "Missing required fields", 
          details: {
            shift_date: !shift_date ? "Shift date is required" : null,
            location_id: !location_id ? "Location ID is required" : null
          }
        });
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(shift_date)) {
        res.status(400).json({ 
          error: "Invalid date format", 
          details: "Date must be in YYYY-MM-DD format" 
        });
        return;
      }

      // Validate location_id
      if (typeof location_id !== 'number' || location_id < 1) {
        res.status(400).json({ 
          error: "Invalid location ID", 
          details: "Location ID must be a positive number" 
        });
        return;
      }

      const shiftData: CreateShiftRequest = {
        shift_date,
        location_id,
        admin_id: admin_id || req.user?.userId
      };

      const newShift = await createShiftOperation(shiftData);
      
      res.status(201).json({ 
        message: "Shift created successfully", 
        data: newShift 
      });
      
    } catch (error: any) {
      console.error('Error creating shift:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({ 
          error: "Shift already exists", 
          details: "A shift already exists for this date" 
        });
      } else if (error.code === '23503') { // Foreign key constraint violation
        res.status(400).json({ 
          error: "Invalid reference", 
          details: "Location ID does not exist" 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to create shift",
          details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
        });
      }
    }
  },

  // Update a shift
  updateShift: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      const updateData = req.body;
      
      if (!date) {
        res.status(400).json({ 
          error: "Missing date parameter", 
          details: "Date is required" 
        });
        return;
      }

      const updatedShift = await updateShiftOperation(date, updateData);
      
      res.status(200).json({ 
        message: "Shift updated successfully", 
        data: updatedShift 
      });
      
    } catch (error: any) {
      console.error('Error updating shift:', error);
      res.status(500).json({ 
        error: "Failed to update shift",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Delete a shift
  deleteShift: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      
      if (!date) {
        res.status(400).json({ 
          error: "Missing date parameter", 
          details: "Date is required" 
        });
        return;
      }

      const deletedShift = await deleteShiftOperation(date);
      
      res.status(200).json({ 
        message: "Shift deleted successfully", 
        data: deletedShift 
      });
      
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      res.status(500).json({ 
        error: "Failed to delete shift",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Get employee schedules
  getEmployeeSchedules: async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: ScheduleFilters = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        location_id: req.query.location_id ? parseInt(req.query.location_id as string) : undefined,
        role_id: req.query.role_id ? parseInt(req.query.role_id as string) : undefined,
      };

      const schedules = await getEmployeeSchedulesOperation(filters);
      
      res.status(200).json({ 
        message: "Employee schedules fetched successfully", 
        data: schedules 
      });
      
    } catch (error: any) {
      console.error('Error fetching employee schedules:', error);
      res.status(500).json({ 
        error: "Failed to fetch employee schedules",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Get schedule assignments
  getScheduleAssignments: async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: ScheduleFilters = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        location_id: req.query.location_id ? parseInt(req.query.location_id as string) : undefined,
        role_id: req.query.role_id ? parseInt(req.query.role_id as string) : undefined,
      };

      const assignments = await getScheduleAssignmentsOperation(filters);
      
      res.status(200).json({ 
        message: "Schedule assignments fetched successfully", 
        data: assignments 
      });
      
    } catch (error: any) {
      console.error('Error fetching schedule assignments:', error);
      res.status(500).json({ 
        error: "Failed to fetch schedule assignments",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Assign employee to shift
  assignEmployee: async (req: Request, res: Response): Promise<void> => {
    try {
      const { shift_date, location_id, employee_id } = req.body as AssignEmployeeRequest;
      
      // Validate required fields
      if (!shift_date || !location_id || !employee_id) {
        res.status(400).json({ 
          error: "Missing required fields", 
          details: {
            shift_date: !shift_date ? "Shift date is required" : null,
            location_id: !location_id ? "Location ID is required" : null,
            employee_id: !employee_id ? "Employee ID is required" : null
          }
        });
        return;
      }

      const assignmentData: AssignEmployeeRequest = {
        shift_date,
        location_id,
        employee_id
      };

      const assignment = await assignEmployeeOperation(assignmentData);
      
      res.status(201).json({ 
        message: "Employee assigned successfully", 
        data: assignment 
      });
      
    } catch (error: any) {
      console.error('Error assigning employee:', error);
      
      if (error.message === 'Employee is already assigned on this date') {
        res.status(409).json({ 
          error: "Assignment conflict", 
          details: error.message 
        });
      } else if (error.message === 'Shift does not exist for this date') {
        res.status(404).json({ 
          error: "Shift not found", 
          details: error.message 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to assign employee",
          details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
        });
      }
    }
  },

  // Unassign employee from shift
  unassignEmployee: async (req: Request, res: Response): Promise<void> => {
    try {
      const { shift_date, location_id, employee_id } = req.body as UnassignEmployeeRequest;
      
      // Validate required fields
      if (!shift_date || !location_id || !employee_id) {
        res.status(400).json({ 
          error: "Missing required fields", 
          details: {
            shift_date: !shift_date ? "Shift date is required" : null,
            location_id: !location_id ? "Location ID is required" : null,
            employee_id: !employee_id ? "Employee ID is required" : null
          }
        });
        return;
      }

      const unassignData: UnassignEmployeeRequest = {
        shift_date,
        location_id,
        employee_id
      };

      const unassignment = await unassignEmployeeOperation(unassignData);
      
      res.status(200).json({ 
        message: "Employee unassigned successfully", 
        data: unassignment 
      });
      
    } catch (error: any) {
      console.error('Error unassigning employee:', error);
      res.status(500).json({ 
        error: "Failed to unassign employee",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Get employees by role
  getEmployeesByRole: async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const { locationId } = req.query;
      
      if (!roleId) {
        res.status(400).json({ 
          error: "Missing role ID parameter", 
          details: "Role ID is required" 
        });
        return;
      }

      const roleIdNum = parseInt(roleId);
      if (isNaN(roleIdNum) || roleIdNum < 1) {
        res.status(400).json({ 
          error: "Invalid role ID", 
          details: "Role ID must be a positive number" 
        });
        return;
      }

      const locationIdNum = locationId ? parseInt(locationId as string) : undefined;
      if (locationId && (isNaN(locationIdNum!) || locationIdNum! < 1)) {
        res.status(400).json({ 
          error: "Invalid location ID", 
          details: "Location ID must be a positive number" 
        });
        return;
      }

      const employees = await getEmployeesByRoleOperation(roleIdNum, locationIdNum);
      
      res.status(200).json({ 
        message: "Employees fetched successfully", 
        data: employees 
      });
      
    } catch (error: any) {
      console.error('Error fetching employees by role:', error);
      res.status(500).json({ 
        error: "Failed to fetch employees by role",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  },

  // Get schedule validation
  getScheduleValidation: async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.params;
      const { locationId } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ 
          error: "Missing date parameters", 
          details: "Start date and end date are required" 
        });
        return;
      }

      const locationIdNum = locationId ? parseInt(locationId as string) : undefined;
      if (locationId && (isNaN(locationIdNum!) || locationIdNum! < 1)) {
        res.status(400).json({ 
          error: "Invalid location ID", 
          details: "Location ID must be a positive number" 
        });
        return;
      }

      const validation = await getScheduleValidationOperation(startDate, endDate, locationIdNum);
      
      res.status(200).json({ 
        message: "Schedule validation completed", 
        data: validation 
      });
      
    } catch (error: any) {
      console.error('Error validating schedule:', error);
      res.status(500).json({ 
        error: "Failed to validate schedule",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  }
};

