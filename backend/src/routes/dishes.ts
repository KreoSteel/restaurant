import { Router } from 'express';
import { dishesController } from '../controllers/dishes';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';

const router = Router();

// All dish routes require authentication
router.use(authenticateSupabaseToken);

// GET /api/dishes - Get all dishes with optional filters
router.get('/', dishesController.getDishes);

// GET /api/dishes/categories - Get all categories
router.get('/categories', dishesController.getCategories);

// GET /api/dishes/:id - Get dish by ID
router.get('/:id', dishesController.getDishById);

// POST /api/dishes - Create new dish
router.post('/', dishesController.createDish);

// PUT /api/dishes/:id - Update dish
router.put('/:id', dishesController.updateDish);

// DELETE /api/dishes/:id - Delete dish
router.delete('/:id', dishesController.deleteDish);

export default router;
