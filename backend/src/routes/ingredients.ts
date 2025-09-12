import { Router } from 'express';
import { ingredientsController } from '../controllers/ingredients';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth';

const router = Router();

// All ingredient routes require authentication
router.use(authenticateSupabaseToken);

// GET /api/ingredients - Get all ingredients with optional filters
router.get('/', ingredientsController.getIngredients);

// GET /api/ingredients/:id - Get ingredient by ID
router.get('/:id', ingredientsController.getIngredientById);

// POST /api/ingredients - Create new ingredient
router.post('/', ingredientsController.createIngredient);

// PUT /api/ingredients/:id - Update ingredient
router.put('/:id', ingredientsController.updateIngredient);

// DELETE /api/ingredients/:id - Delete ingredient
router.delete('/:id', ingredientsController.deleteIngredient);

export default router;
