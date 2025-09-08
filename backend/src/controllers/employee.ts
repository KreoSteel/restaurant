import { 
    getEmployeesOperation, 
    getEmployeeByIdOperation, 
    createEmployeeOperation, 
    updateEmployeeOperation, 
    fireEmployeeOperation 
} from "../operations/employee";
import { getEmployeeByUuid, updateEmployeeByUuid, createEmployeeByUuid } from "../services/employee";
import { Request, Response } from "express";
import { paginate, Pagination } from "../utils/pagination";
import { CreateEmployeeRequest, UpdateEmployeeRequest } from "../types/employee";

export const employeeController = {
    getEmployees: async (req: Request, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100) {
                res.status(400).json({ 
                    error: "Invalid pagination parameters", 
                    details: {
                        page: page < 1 ? "Page must be greater than 0" : null,
                        limit: limit < 1 ? "Limit must be greater than 0" : null,
                        limitMax: limit > 100 ? "Limit cannot exceed 100" : null
                    }
                });
                return;
            }
            
            const employees = await getEmployeesOperation();
            
            if (!employees || employees.length === 0) {
                res.status(404).json({ 
                    error: "No employees found",
                    message: "The employees list is empty"
                });
                return;
            }
            
            const paginatedEmployees = paginate(employees, page, limit);
            
            if (paginatedEmployees.page > paginatedEmployees.total) {
                res.status(404).json({ 
                    error: "Page not found",
                    details: `Requested page ${page} exceeds total pages ${paginatedEmployees.total}`
                });
                return;
            }
            
            res.status(200).json({ 
                message: "Employees fetched successfully", 
                data: paginatedEmployees 
            });
            
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            
            if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Employees table not found" 
                });
            } else if (error.code === '42501') { // Insufficient privileges
                res.status(500).json({ 
                    error: "Permission denied", 
                    details: "Insufficient database privileges" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch employees",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    getEmployeeById: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid employee ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const employee = await getEmployeeByIdOperation(id);
            
            if (!employee) {
                res.status(404).json({ 
                    error: "Employee not found",
                    details: `No employee found with ID ${id}` 
                });
                return;
            }
            
            res.status(200).json({ 
                message: "Employee fetched successfully", 
                data: employee 
            });
            
        } catch (error: any) {
            console.error('Error fetching employee:', error);
            
            if (error.code === 'PGRST116') { // No rows returned
                res.status(404).json({ 
                    error: "Employee not found",
                    details: "The requested employee does not exist" 
                });
            } else if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Employees table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch employee",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    createEmployee: async (req: Request, res: Response): Promise<void> => {
        try {
            const { full_name, age, email, password_hashed, is_featured, role_id, location_id } = req.body as CreateEmployeeRequest;
            
            // Validate required fields
            if (!full_name || !email || !password_hashed || !role_id || !location_id) {
                res.status(400).json({ 
                    error: "Missing required fields", 
                    details: {
                        full_name: !full_name ? "Full name is required" : null,
                        email: !email ? "Email is required" : null,
                        password_hashed: !password_hashed ? "Password is required" : null,
                        role_id: !role_id ? "Role ID is required" : null,
                        location_id: !location_id ? "Location ID is required" : null
                    }
                });
                return;
            }
            
            // Validate field types and formats
            if (typeof full_name !== 'string' || full_name.trim().length === 0) {
                res.status(400).json({ 
                    error: "Invalid full name format", 
                    details: "Full name must be a non-empty string" 
                });
                return;
            }
            
            if (full_name.trim().length < 2 || full_name.trim().length > 100) {
                res.status(400).json({ 
                    error: "Invalid full name length", 
                    details: "Full name must be between 2 and 100 characters" 
                });
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ 
                    error: "Invalid email format", 
                    details: "Please provide a valid email address" 
                });
                return;
            }
            
            // Validate age if provided
            if (age !== undefined) {
                if (typeof age !== 'number' || isNaN(age)) {
                    res.status(400).json({ 
                        error: "Invalid age format", 
                        details: "Age must be a valid number" 
                    });
                    return;
                }
                
                if (age < 16 || age > 100) {
                    res.status(400).json({ 
                        error: "Invalid age range", 
                        details: "Age must be between 16 and 100" 
                    });
                    return;
                }
            }
            
            // Validate role_id and location_id
            if (typeof role_id !== 'number' || role_id < 1) {
                res.status(400).json({ 
                    error: "Invalid role ID", 
                    details: "Role ID must be a positive number" 
                });
                return;
            }
            
            if (typeof location_id !== 'number' || location_id < 1) {
                res.status(400).json({ 
                    error: "Invalid location ID", 
                    details: "Location ID must be a positive number" 
                });
                return;
            }
            
            // Validate is_featured if provided
            if (is_featured !== undefined && typeof is_featured !== 'boolean') {
                res.status(400).json({ 
                    error: "Invalid featured status", 
                    details: "Featured status must be a boolean value" 
                });
                return;
            }
            
            const newEmployee = await createEmployeeOperation({ 
                full_name: full_name.trim(), 
                age, 
                email: email.trim().toLowerCase(), 
                password_hashed, 
                is_featured: is_featured || false, 
                role_id, 
                location_id 
            });
            
            res.status(201).json({ 
                message: "Employee created successfully", 
                data: newEmployee 
            });
            
        } catch (error: any) {
            console.error('Error creating employee:', error);
            
            if (error.code === '23505') { // Unique constraint violation
                res.status(409).json({ 
                    error: "Employee already exists", 
                    details: "An employee with this email already exists" 
                });
            } else if (error.code === '23502') { // Not null constraint violation
                res.status(400).json({ 
                    error: "Missing required fields", 
                    details: "All required fields must be provided" 
                });
            } else if (error.code === '23503') { // Foreign key constraint violation
                res.status(400).json({ 
                    error: "Invalid reference", 
                    details: "Role ID or Location ID does not exist" 
                });
            } else if (error.code === '23514') { // Check constraint violation
                res.status(400).json({ 
                    error: "Invalid data", 
                    details: "Data does not meet validation requirements" 
                });
            } else if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Employees table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to create employee",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    updateEmployee: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid employee ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const { full_name, age, email, password_hashed, is_featured, role_id, location_id } = req.body as UpdateEmployeeRequest;
            
            // Check if at least one field is provided for update
            if (!full_name && age === undefined && !email && !password_hashed && is_featured === undefined && !role_id && !location_id) {
                res.status(400).json({ 
                    error: "No valid fields to update", 
                    details: "At least one field must be provided for update" 
                });
                return;
            }
            
            // Build update object with validation
            const updateData: UpdateEmployeeRequest = {};
            
            if (full_name !== undefined) {
                if (typeof full_name !== 'string' || full_name.trim().length === 0) {
                    res.status(400).json({ 
                        error: "Invalid full name format", 
                        details: "Full name must be a non-empty string" 
                    });
                    return;
                }
                
                if (full_name.trim().length < 2 || full_name.trim().length > 100) {
                    res.status(400).json({ 
                        error: "Invalid full name length", 
                        details: "Full name must be between 2 and 100 characters" 
                    });
                    return;
                }
                
                updateData.full_name = full_name.trim();
            }
            
            if (age !== undefined) {
                if (typeof age !== 'number' || isNaN(age)) {
                    res.status(400).json({ 
                        error: "Invalid age format", 
                        details: "Age must be a valid number" 
                    });
                    return;
                }
                
                if (age < 16 || age > 100) {
                    res.status(400).json({ 
                        error: "Invalid age range", 
                        details: "Age must be between 16 and 100" 
                    });
                    return;
                }
                
                updateData.age = age;
            }
            
            if (email !== undefined) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    res.status(400).json({ 
                        error: "Invalid email format", 
                        details: "Please provide a valid email address" 
                    });
                    return;
                }
                
                updateData.email = email.trim().toLowerCase();
            }
            
            if (password_hashed !== undefined) {
                if (typeof password_hashed !== 'string' || password_hashed.length === 0) {
                    res.status(400).json({ 
                        error: "Invalid password", 
                        details: "Password cannot be empty" 
                    });
                    return;
                }
                
                updateData.password_hashed = password_hashed;
            }
            
            if (is_featured !== undefined) {
                if (typeof is_featured !== 'boolean') {
                    res.status(400).json({ 
                        error: "Invalid featured status", 
                        details: "Featured status must be a boolean value" 
                    });
                    return;
                }
                
                updateData.is_featured = is_featured;
            }
            
            if (role_id !== undefined) {
                if (typeof role_id !== 'number' || role_id < 1) {
                    res.status(400).json({ 
                        error: "Invalid role ID", 
                        details: "Role ID must be a positive number" 
                    });
                    return;
                }
                
                updateData.role_id = role_id;
            }
            
            if (location_id !== undefined) {
                if (typeof location_id !== 'number' || location_id < 1) {
                    res.status(400).json({ 
                        error: "Invalid location ID", 
                        details: "Location ID must be a positive number" 
                    });
                    return;
                }
                
                updateData.location_id = location_id;
            }
            
            const updatedEmployee = await updateEmployeeOperation(id, updateData);
            
            res.status(200).json({ 
                message: "Employee updated successfully", 
                data: updatedEmployee 
            });
            
        } catch (error: any) {
            console.error('Error updating employee:', error);
            
            if (error.code === 'PGRST116') { // No rows returned
                res.status(404).json({ 
                    error: "Employee not found",
                    details: "The employee to update does not exist" 
                });
            } else if (error.code === '23505') { // Unique constraint violation
                res.status(409).json({ 
                    error: "Employee already exists", 
                    details: "An employee with this email already exists" 
                });
            } else if (error.code === '23503') { // Foreign key constraint violation
                res.status(400).json({ 
                    error: "Invalid reference", 
                    details: "Role ID or Location ID does not exist" 
                });
            } else if (error.code === '23514') { // Check constraint violation
                res.status(400).json({ 
                    error: "Invalid data", 
                    details: "Data does not meet validation requirements" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to update employee",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    fireEmployee: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID parameter
            if (isNaN(id) || id < 1) {
                res.status(400).json({ 
                    error: "Invalid employee ID", 
                    details: "ID must be a positive number" 
                });
                return;
            }
            
            const firedEmployee = await fireEmployeeOperation(id);
            
            res.status(200).json({ 
                message: "Employee fired successfully", 
                data: firedEmployee,
                note: "Employee featured status has been set to false"
            });
            
        } catch (error: any) {
            console.error('Error firing employee:', error);
            
            if (error.code === 'PGRST116') { // No rows returned
                res.status(404).json({ 
                    error: "Employee not found",
                    details: "The employee to fire does not exist" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fire employee",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    // Profile methods - get current user's employee profile
    getProfile: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId || req.user?.id;
            
            console.log('Profile request - User data:', req.user);
            console.log('Profile request - UserId:', userId);
            
            if (!userId) {
                res.status(401).json({ 
                    error: "Unauthorized", 
                    details: "User ID not found in token" 
                });
                return;
            }
            
            // Find employee by UUID using existing employee service
            const { data: profile, error } = await getEmployeeByUuid(userId);
            
            if (error) {
                throw error;
            }
            
            if (!profile) {
                res.status(404).json({ 
                    error: "Profile not found",
                    message: "No employee profile found for this user. Please create a profile first."
                });
                return;
            }
            
            res.status(200).json({ 
                message: "Profile fetched successfully", 
                data: profile 
            });
            
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            
            if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Employees table not found" 
                });
            } else if (error.code === '42501') { // Insufficient privileges
                res.status(500).json({ 
                    error: "Permission denied", 
                    details: "Insufficient database privileges" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to fetch profile",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    },

    // Profile methods - update current user's employee profile
    updateProfile: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId || req.user?.id;
            
            if (!userId) {
                res.status(401).json({ 
                    error: "Unauthorized", 
                    details: "User ID not found in token" 
                });
                return;
            }
            
            const { full_name, age, email, is_featured, role_id, location_id } = req.body as UpdateEmployeeRequest;
            
            // Check if at least one field is provided for update
            if (!full_name && age === undefined && !email && is_featured === undefined && !role_id && !location_id) {
                res.status(400).json({ 
                    error: "No valid fields to update", 
                    details: "At least one field must be provided for update" 
                });
                return;
            }
            
            // Build update object with validation
            const updateData: UpdateEmployeeRequest = {};
            
            if (full_name !== undefined) {
                if (typeof full_name !== 'string' || full_name.trim().length === 0) {
                    res.status(400).json({ 
                        error: "Invalid full name format", 
                        details: "Full name must be a non-empty string" 
                    });
                    return;
                }
                
                if (full_name.trim().length < 2 || full_name.trim().length > 100) {
                    res.status(400).json({ 
                        error: "Invalid full name length", 
                        details: "Full name must be between 2 and 100 characters" 
                    });
                    return;
                }
                
                updateData.full_name = full_name.trim();
            }
            
            if (age !== undefined) {
                if (typeof age !== 'number' || isNaN(age)) {
                    res.status(400).json({ 
                        error: "Invalid age format", 
                        details: "Age must be a valid number" 
                    });
                    return;
                }
                
                if (age < 16 || age > 100) {
                    res.status(400).json({ 
                        error: "Invalid age range", 
                        details: "Age must be between 16 and 100" 
                    });
                    return;
                }
                
                updateData.age = age;
            }
            
            if (email !== undefined) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    res.status(400).json({ 
                        error: "Invalid email format", 
                        details: "Please provide a valid email address" 
                    });
                    return;
                }
                
                updateData.email = email.trim().toLowerCase();
            }
            
            if (is_featured !== undefined) {
                if (typeof is_featured !== 'boolean') {
                    res.status(400).json({ 
                        error: "Invalid featured status", 
                        details: "Featured status must be a boolean value" 
                    });
                    return;
                }
                
                updateData.is_featured = is_featured;
            }
            
            if (role_id !== undefined) {
                if (typeof role_id !== 'number' || role_id < 1) {
                    res.status(400).json({ 
                        error: "Invalid role ID", 
                        details: "Role ID must be a positive number" 
                    });
                    return;
                }
                
                updateData.role_id = role_id;
            }
            
            if (location_id !== undefined) {
                if (typeof location_id !== 'number' || location_id < 1) {
                    res.status(400).json({ 
                        error: "Invalid location ID", 
                        details: "Location ID must be a positive number" 
                    });
                    return;
                }
                
                updateData.location_id = location_id;
            }
            
            // Check if profile exists, if not create it
            let profile;
            const { data: existingProfile, error: getError } = await getEmployeeByUuid(userId);
            
            if (getError && getError.code === 'PGRST116') {
                // Profile doesn't exist, create it
                console.log('Profile not found, creating new one for user:', userId);
                const { data: newProfile, error: createError } = await createEmployeeByUuid(userId, updateData);
                if (createError) throw createError;
                profile = newProfile;
            } else if (getError) {
                // Some other error occurred
                throw getError;
            } else if (!existingProfile) {
                // Profile doesn't exist, create it
                console.log('Profile not found, creating new one for user:', userId);
                const { data: newProfile, error: createError } = await createEmployeeByUuid(userId, updateData);
                if (createError) throw createError;
                profile = newProfile;
            } else {
                // Profile exists, update it
                console.log('Updating existing profile for user:', userId);
                const { data: updatedProfile, error: updateError } = await updateEmployeeByUuid(userId, updateData);
                if (updateError) throw updateError;
                profile = updatedProfile;
            }
            
            res.status(200).json({ 
                message: "Profile updated successfully", 
                data: profile 
            });
            
        } catch (error: any) {
            console.error('Error updating profile:', error);
            
            if (error.code === '23505') { // Unique constraint violation
                res.status(409).json({ 
                    error: "Profile already exists", 
                    details: "An employee with this email already exists" 
                });
            } else if (error.code === '23502') { // Not null constraint violation
                res.status(400).json({ 
                    error: "Missing required fields", 
                    details: "All required fields must be provided" 
                });
            } else if (error.code === '23503') { // Foreign key constraint violation
                res.status(400).json({ 
                    error: "Invalid reference", 
                    details: "Role ID or Location ID does not exist" 
                });
            } else if (error.code === '23514') { // Check constraint violation
                res.status(400).json({ 
                    error: "Invalid data", 
                    details: "Data does not meet validation requirements" 
                });
            } else if (error.code === '42P01') { // Table doesn't exist
                res.status(500).json({ 
                    error: "Database configuration error", 
                    details: "Employees table not found" 
                });
            } else {
                res.status(500).json({ 
                    error: "Failed to update profile",
                    details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
                });
            }
        }
    }
};