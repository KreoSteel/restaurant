import { 
    getDishesOperation, 
    getDishByIdOperation, 
    createDishOperation, 
    updateDishOperation, 
    deleteDishOperation,
    getCategoriesOperation
} from "../operations/dishes";
import { Request, Response } from "express";
import { CreateDishRequest, UpdateDishRequest, DishFilters } from "../types/dishes";

export const dishesController = {
    getDishes: async (req: Request, res: Response): Promise<void> => {
        try {
            const filters: DishFilters = {};
            
            // Parse query parameters
            if (req.query.search) filters.search = req.query.search as string;
            if (req.query.min_price) filters.min_price = parseFloat(req.query.min_price as string);
            if (req.query.max_price) filters.max_price = parseFloat(req.query.max_price as string);
            if (req.query.min_rating) filters.min_rating = parseFloat(req.query.min_rating as string);
            if (req.query.max_rating) filters.max_rating = parseFloat(req.query.max_rating as string);
            if (req.query.category_id) filters.category_id = parseInt(req.query.category_id as string);

            const dishes = await getDishesOperation(filters);
            
            if (!dishes || dishes.length === 0) {
                res.status(404).json({ 
                    error: "No dishes found",
                    message: "The dishes list is empty"
                });
                return;
            }
            
            res.status(200).json({ 
                message: "Dishes fetched successfully", 
                data: dishes 
            });
            
        } catch (error: any) {
            console.error('Error fetching dishes:', error);
            
            if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Dishes table not found" 
                });
            } else if (error.code === '42501') { // Insufficient privileges
                res.status(500).json({ 
                    error: "Permission denied", 
                    details: "Insufficient database privileges" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch dishes",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    getDishById: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid dish ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const dish = await getDishByIdOperation(id);
            
            if (!dish) {
                res.status(404).json({ 
                    error: "Dish not found",
                    details: `No dish found with ID ${id}` 
                });
                return;
            }
            
            res.status(200).json({ 
                message: "Dish fetched successfully", 
                data: dish 
            });
            
        } catch (error: any) {
            console.error('Error fetching dish:', error);
            
            if (error.code === 'PGRST116') { // No rows returned
                res.status(404).json({ 
                    error: "Dish not found",
                    details: "The requested dish does not exist" 
                });
            } else if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Dishes table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch dish",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    createDish: async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, description, price, rating, category_id, ingredients } = req.body as CreateDishRequest;
            
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
            
            // Validate rating if provided
            if (rating !== undefined) {
                if (typeof rating !== 'number' || isNaN(rating)) {
                    res.status(400).json({ 
                        error: "Invalid rating format", 
                        details: "Rating must be a valid number" 
                    });
                    return;
                }
                
                if (rating < 0 || rating > 5) {
                    res.status(400).json({ 
                        error: "Invalid rating range", 
                        details: "Rating must be between 0 and 5" 
                    });
                    return;
                }
            }
            
            // Validate category_id if provided
            if (category_id !== undefined) {
                if (typeof category_id !== 'number' || isNaN(category_id) || category_id < 1) {
                    res.status(400).json({ 
                        error: "Invalid category ID", 
                        details: "Category ID must be a positive number" 
                    });
                    return;
                }
            }
            
            // Validate ingredients if provided
            if (ingredients !== undefined) {
                if (!Array.isArray(ingredients)) {
                    res.status(400).json({ 
                        error: "Invalid ingredients format", 
                        details: "Ingredients must be an array" 
                    });
                    return;
                }
                
                if (ingredients.some(id => typeof id !== 'number' || isNaN(id) || id < 1)) {
                    res.status(400).json({ 
                        error: "Invalid ingredient IDs", 
                        details: "All ingredient IDs must be positive numbers" 
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
            
            const newDish = await createDishOperation({ 
                name: name.trim(), 
                description: description?.trim() || undefined, 
                price: price || 0, 
                rating: rating,
                category_id: category_id,
                ingredients: ingredients || []
            });
            
            res.status(201).json({ 
                message: "Dish created successfully", 
                data: newDish 
            });
            
        } catch (error: any) {
            console.error('Error creating dish:', error);
            
            if (error.code === '23505') { // Unique constraint violation
                res.status(409).json({ 
                    error: "Dish already exists", 
                    details: "A dish with this name already exists" 
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
            } else if (error.code === '23503') { // Foreign key constraint violation
                res.status(400).json({ 
                    error: "Invalid reference", 
                    details: "Category or ingredient does not exist" 
                });
            } else if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Dishes table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to create dish",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    updateDish: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid dish ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const { name, description, price, rating, category_id, ingredients } = req.body as UpdateDishRequest;
            
            // Check if at least one field is provided for update
            if (!name && description === undefined && price === undefined && rating === undefined && category_id === undefined && ingredients === undefined) {
                res.status(400).json({ 
                    error: "No valid fields to update", 
                    details: "At least one field must be provided for update" 
                });
                return;
            }
            
            // Build update object with validation
            const updateData: UpdateDishRequest = {};
            
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
            
            if (rating !== undefined) {
                if (typeof rating !== 'number' || isNaN(rating)) {
                    res.status(400).json({ 
                        error: "Invalid rating format", 
                        details: "Rating must be a valid number" 
                    });
                    return;
                }
                
                if (rating < 0 || rating > 5) {
                    res.status(400).json({ 
                        error: "Invalid rating range", 
                        details: "Rating must be between 0 and 5" 
                    });
                    return;
                }
                
                updateData.rating = rating;
            }
            
            if (category_id !== undefined) {
                if (typeof category_id !== 'number' || isNaN(category_id) || category_id < 1) {
                    res.status(400).json({ 
                        error: "Invalid category ID", 
                        details: "Category ID must be a positive number" 
                    });
                    return;
                }
                
                updateData.category_id = category_id;
            }
            
            if (ingredients !== undefined) {
                if (!Array.isArray(ingredients)) {
                    res.status(400).json({ 
                        error: "Invalid ingredients format", 
                        details: "Ingredients must be an array" 
                    });
                    return;
                }
                
                if (ingredients.some(id => typeof id !== 'number' || isNaN(id) || id < 1)) {
                    res.status(400).json({ 
                        error: "Invalid ingredient IDs", 
                        details: "All ingredient IDs must be positive numbers" 
                    });
                    return;
                }
                
                updateData.ingredients = ingredients;
            }
            
            const updatedDish = await updateDishOperation(id, updateData);
            
            res.status(200).json({ 
                message: "Dish updated successfully", 
                data: updatedDish 
            });
            
        } catch (error: any) {
            console.error('Error updating dish:', error);
            
            if (error.message === 'Dish not found') {
                res.status(404).json({ 
                    error: "Dish not found",
                    details: "The dish to update does not exist" 
                });
            } else if (error.code === '23505') { // Unique constraint violation
                res.status(409).json({ 
                    error: "Dish already exists", 
                    details: "A dish with this name already exists" 
                });
            } else if (error.code === '23514') { // Check constraint violation
                res.status(400).json({ 
                    error: "Invalid data", 
                    details: "Data does not meet validation requirements" 
                });
            } else if (error.code === '23503') { // Foreign key constraint violation
                res.status(400).json({ 
                    error: "Invalid reference", 
                    details: "Category or ingredient does not exist" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to update dish",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    deleteDish: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid dish ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const deletedDish = await deleteDishOperation(id);
            
            res.status(200).json({ 
                message: "Dish deleted successfully", 
                data: deletedDish 
            });
            
        } catch (error: any) {
            console.error('Error deleting dish:', error);
            
            if (error.message === 'Dish not found') {
                res.status(404).json({ 
                    error: "Dish not found",
                    details: "The dish to delete does not exist" 
                });
            } else if (error.code === '23503') { // Foreign key constraint violation
                res.status(400).json({ 
                    error: "Cannot delete dish", 
                    details: "This dish is being used in orders and cannot be deleted" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to delete dish",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    getCategories: async (req: Request, res: Response): Promise<void> => {
        try {
            const categories = await getCategoriesOperation();
            
            res.status(200).json({ 
                message: "Categories fetched successfully", 
                data: categories 
            });
            
        } catch (error: any) {
            console.error('Error fetching categories:', error);
            
            if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Categories table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch categories",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    }
};
