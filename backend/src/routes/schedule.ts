import { Router } from 'express';
import { scheduleController } from '../controllers/schedule';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateSupabaseToken);

// Shift routes
router.get('/shifts', scheduleController.getShifts);
router.get('/shifts/:date', scheduleController.getShiftByDate);
router.post('/shifts', scheduleController.createShift);
router.put('/shifts/:date', scheduleController.updateShift);
router.delete('/shifts/:date', scheduleController.deleteShift);

// Employee schedule routes
router.get('/employee-schedules', scheduleController.getEmployeeSchedules);
router.get('/assignments', scheduleController.getScheduleAssignments);
router.post('/assign', scheduleController.assignEmployee);
router.delete('/unassign', scheduleController.unassignEmployee);

// Utility routes
router.get('/employees/role/:roleId', scheduleController.getEmployeesByRole);
router.get('/validation/:startDate/:endDate', scheduleController.getScheduleValidation);

export default router;

