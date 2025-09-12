import { 
    getIngredientsOperation, 
    getIngredientByIdOperation, 
    createIngredientOperation, 
    updateIngredientOperation, 
    deleteIngredientOperation 
} from "../operations/ingredients";
import { Request, Response } from "express";
import { CreateIngredientRequest, UpdateIngredientRequest, IngredientFilters } from "../types/ingredients";

export const ingredientsController = {
    getIngredients: async (req: Request, res: Response): Promise<void> => {
        try {
            const filters: IngredientFilters = {};
            
            // Parse query parameters
            if (req.query.search) filters.search = req.query.search as string;
            if (req.query.min_price) filters.min_price = parseFloat(req.query.min_price as string);
            if (req.query.max_price) filters.max_price = parseFloat(req.query.max_price as string);
            if (req.query.min_quantity) filters.min_quantity = parseFloat(req.query.min_quantity as string);
            if (req.query.max_quantity) filters.max_quantity = parseFloat(req.query.max_quantity as string);

            const ingredients = await getIngredientsOperation(filters);
            
            if (!ingredients || ingredients.length === 0) {
                res.status(404).json({ 
                    error: "No ingredients found",
                    message: "The ingredients list is empty"
                });
                return;
            }
            
            res.status(200).json({ 
                message: "Ingredients fetched successfully", 
                data: ingredients 
            });
            
        } catch (error: any) {
            console.error('Error fetching ingredients:', error);
            
            if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Ingredients table not found" 
                });
            } else if (error.code === '42501') { // Insufficient privileges
                res.status(500).json({ 
                    error: "Permission denied", 
                    details: "Insufficient database privileges" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch ingredients",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    getIngredientById: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid ingredient ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const ingredient = await getIngredientByIdOperation(id);
            
            if (!ingredient) {
                res.status(404).json({ 
                    error: "Ingredient not found",
                    details: `No ingredient found with ID ${id}` 
                });
                return;
            }
            
            res.status(200).json({ 
                message: "Ingredient fetched successfully", 
                data: ingredient 
            });
            
        } catch (error: any) {
            console.error('Error fetching ingredient:', error);
            
            if (error.code === 'PGRST116') { // No rows returned
                res.status(404).json({ 
                    error: "Ingredient not found",
                    details: "The requested ingredient does not exist" 
                });
            } else if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Ingredients table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch ingredient",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    createIngredient: async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, description, price, quantity } = req.body as CreateIngredientRequest;
            
            // Validate required fields
            if (!name) {
                res.status(400).json({ 
                    error: "Missing required fields", 
                    details: {
                        name: "Name is required"
                    }
                });
                return;
            }
            
            // Validate field types and formats
            if (typeof name !== 'string' || name.trim().length === 0) {
                res.status(400).json({ 
                    error: "Invalid name format", 
                    details: "Name must be a non-empty string" 
                });
                return;
            }
            
            if (name.trim().length < 2 || name.trim().length > 100) {
                res.status(400).json({ 
                    error: "Invalid name length", 
                    details: "Name must be between 2 and 100 characters" 
                });
                return;
            }
            
            // Validate price if provided
            if (price !== undefined) {
                if (typeof price !== 'number' || isNaN(price)) {
                    res.status(400).json({ 
                        error: "Invalid price format", 
                        details: "Price must be a valid number" 
                    });
                    return;
                }
                
                if (price < 0) {
                    res.status(400).json({ 
                        error: "Invalid price range", 
                        details: "Price must be non-negative" 
                    });
                    return;
                }
            }
            
            // Validate quantity if provided
            if (quantity !== undefined) {
                if (typeof quantity !== 'number' || isNaN(quantity)) {
                    res.status(400).json({ 
                        error: "Invalid quantity format", 
                        details: "Quantity must be a valid number" 
                    });
                    return;
                }
                
                if (quantity < 0) {
                    res.status(400).json({ 
                        error: "Invalid quantity range", 
                        details: "Quantity must be non-negative" 
                    });
                    return;
                }
            }
            
            // Validate description if provided
            if (description !== undefined && description !== null) {
                if (typeof description !== 'string') {
                    res.status(400).json({ 
                        error: "Invalid description format", 
                        details: "Description must be a string" 
                    });
                    return;
                }
                
                if (description.length > 500) {
                    res.status(400).json({ 
                        error: "Invalid description length", 
                        details: "Description must be less than 500 characters" 
                    });
                    return;
                }
            }
            
            const newIngredient = await createIngredientOperation({ 
                name: name.trim(), 
                description: description?.trim() || undefined, 
                price: price || 0, 
                quantity: quantity || 0 
            });
            
            res.status(201).json({ 
                message: "Ingredient created successfully", 
                data: newIngredient 
            });
            
        } catch (error: any) {
            console.error('Error creating ingredient:', error);
            
            if (error.code === '23505') { // Unique constraint violation
                res.status(409).json({ 
                    error: "Ingredient already exists", 
                    details: "An ingredient with this name already exists" 
                });
            } else if (error.code === '23502') { // Not null constraint violation
                res.status(400).json({ 
                    error: "Missing required fields", 
                    details: "All required fields must be provided" 
                });
            } else if (error.code === '23514') { // Check constraint violation
                res.status(400).json({ 
                    error: "Invalid data", 
                    details: "Data does not meet validation requirements" 
                });
            } else if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Ingredients table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to create ingredient",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    updateIngredient: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid ingredient ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const { name, description, price, quantity } = req.body as UpdateIngredientRequest;
            
            // Check if at least one field is provided for update
            if (!name && description === undefined && price === undefined && quantity === undefined) {
                res.status(400).json({ 
                    error: "No valid fields to update", 
                    details: "At least one field must be provided for update" 
                });
                return;
            }
            
            // Build update object with validation
            const updateData: UpdateIngredientRequest = {};
            
            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim().length === 0) {
                    res.status(400).json({ 
                        error: "Invalid name format", 
                        details: "Name must be a non-empty string" 
                    });
                    return;
                }
                
                if (name.trim().length < 2 || name.trim().length > 100) {
                    res.status(400).json({ 
                        error: "Invalid name length", 
                        details: "Name must be between 2 and 100 characters" 
                    });
                    return;
                }
                
                updateData.name = name.trim();
            }
            
            if (description !== undefined) {
                if (description !== null && typeof description !== 'string') {
                    res.status(400).json({ 
                        error: "Invalid description format", 
                        details: "Description must be a string or null" 
                    });
                    return;
                }
                
                if (description && description.length > 500) {
                    res.status(400).json({ 
                        error: "Invalid description length", 
                        details: "Description must be less than 500 characters" 
                    });
                    return;
                }
                
                updateData.description = description?.trim() || undefined;
            }
            
            if (price !== undefined) {
                if (typeof price !== 'number' || isNaN(price)) {
                    res.status(400).json({ 
                        error: "Invalid price format", 
                        details: "Price must be a valid number" 
                    });
                    return;
                }
                
                if (price < 0) {
                    res.status(400).json({ 
                        error: "Invalid price range", 
                        details: "Price must be non-negative" 
                    });
                    return;
                }
                
                updateData.price = price;
            }
            
            if (quantity !== undefined) {
                if (typeof quantity !== 'number' || isNaN(quantity)) {
                    res.status(400).json({ 
                        error: "Invalid quantity format", 
                        details: "Quantity must be a valid number" 
                    });
                    return;
                }
                
                if (quantity < 0) {
                    res.status(400).json({ 
                        error: "Invalid quantity range", 
                        details: "Quantity must be non-negative" 
                    });
                    return;
                }
                
                updateData.quantity = quantity;
            }
            
            const updatedIngredient = await updateIngredientOperation(id, updateData);
            
            res.status(200).json({ 
                message: "Ingredient updated successfully", 
                data: updatedIngredient 
            });
            
        } catch (error: any) {
            console.error('Error updating ingredient:', error);
            
            if (error.code === 'PGRST116') { // No rows returned
                res.status(404).json({ 
                    error: "Ingredient not found",
                    details: "The ingredient to update does not exist" 
                });
            } else if (error.code === '23505') { // Unique constraint violation
                res.status(409).json({ 
                    error: "Ingredient already exists", 
                    details: "An ingredient with this name already exists" 
                });
            } else if (error.code === '23514') { // Check constraint violation
                res.status(400).json({ 
                    error: "Invalid data", 
                    details: "Data does not meet validation requirements" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to update ingredient",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    deleteIngredient: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid ingredient ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const deletedIngredient = await deleteIngredientOperation(id);
            
            res.status(200).json({ 
                message: "Ingredient deleted successfully", 
                data: deletedIngredient 
            });
            
        } catch (error: any) {
            console.error('Error deleting ingredient:', error);
            
            if (error.code === 'PGRST116') { // No rows returned
                res.status(404).json({ 
                    error: "Ingredient not found",
                    details: "The ingredient to delete does not exist" 
                });
            } else if (error.code === '23503') { // Foreign key constraint violation
                res.status(400).json({ 
                    error: "Cannot delete ingredient", 
                    details: "This ingredient is being used in dishes and cannot be deleted" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to delete ingredient",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    }
};
