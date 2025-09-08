import { employeeController } from "../controllers/employee";
import { Router } from "express";
import { authenticateSupabaseToken } from "../middleware/supabaseAuth";

const router = Router();

// Test route to verify routing works
router.get('/test', (req, res) => {
  res.json({ message: 'Employee routes working!' });
});

// Test route to check database without auth
router.get('/test-db', async (req, res) => {
  try {
    const { getEmployeeByUuid } = await import('../services/employee');
    const result = await getEmployeeByUuid('403198a3-ebd2-4ae4-a4a4-c73ed630793d');
    res.json({ 
      message: 'Database test', 
      result: result 
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
});

// Profile routes (authentication required) - MUST come before /:id routes
router.get('/profile', authenticateSupabaseToken, employeeController.getProfile);
router.patch('/profile', authenticateSupabaseToken, employeeController.updateProfile);

// Public routes (no authentication required)
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.patch('/:id', employeeController.updateEmployee);
router.patch('/:id/fire', employeeController.fireEmployee);

export default router;

