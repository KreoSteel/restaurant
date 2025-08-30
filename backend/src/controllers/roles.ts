import { getRolesOperation, getRoleByIdOperation, createRoleOperation, updateRoleOperation } from "../operations/roles";
import { Request, Response } from "express";
import { paginate, Pagination } from "../utils/pagination";
import Role from "../types/roles";


export const roleController = {
    getRoles: async (req: Request, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const roles = await getRolesOperation();
            const paginatedRoles = paginate(roles, page, limit);

            if (paginatedRoles.page > paginatedRoles.total) {
                res.status(404).json({ error: "Page not found" });
            }
            if (!paginatedRoles.data.length) {
                res.status(404).json({ error: "No roles found" });
            }
            res.status(200).json({ message: "Roles fetched successfully", paginatedRoles });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch roles" });
        }
    },

    getRoleById: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: "Invalid role ID" });
            }
            const role = await getRoleByIdOperation(id);
            if (!role) {
                res.status(404).json({ error: "Role not found" });
            }
            res.status(200).json({ message: "Role fetched successfully", role });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch role" });
        }
    },

    createRole: async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, salary_per_day, description } = req.body;
            if (!name || typeof salary_per_day !== "number" || !description) {
                res.status(400).json({ error: "Missing or invalid role data" });
            }
            const newRole = await createRoleOperation({ name, salary_per_day, description });
            res.status(201).json({ message: "Role created successfully", role: newRole });
        } catch (error) {
            res.status(500).json({ error: "Failed to create role" });
        }
    },

    updateRole: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: "Invalid role ID" });
                return;
            }
            
            const { name, salary_per_day, description } = req.body;
            
            // Check if at least one field is provided for update
            if (!name && typeof salary_per_day !== "number" && !description) {
                res.status(400).json({ error: "No valid fields to update" });
                return;
            }
            
            // Build update object with only provided fields
            const updateData: Partial<Role> = {};
            
            if (name !== undefined) {
                updateData.name = name;
            }
            
            if (typeof salary_per_day === "number") {
                updateData.salary_per_day = salary_per_day;
            }
            
            if (description !== undefined) {
                updateData.description = description;
            }
            
            // Always add updated_at timestamp
            updateData.updated_at = new Date().toISOString();
            
            const updatedRole = await updateRoleOperation(id, updateData);
            res.status(200).json({ message: "Role updated successfully", role: updatedRole });
            
        } catch (error) {
            res.status(500).json({ error: "Failed to update role" });
        }
    }
};