import { getRoles, getRoleById, createRole, updateRole } from "../services/roles";
import Role from "../types/roles";

export async function getRolesOperation(): Promise<Role[]> {
    const { data, error } = await getRoles()
    if (error) {
        throw error
    }
    return data
}

export async function getRoleByIdOperation(id: number): Promise<Role> {
    const { data, error } = await getRoleById(id)
    if (error) {
        throw error
    }
    return data
}

export async function createRoleOperation(role: Partial<Role>): Promise<Role> {
    const { data, error } = await createRole(role)
    if (error) {
        throw error
    }
    return data
}

export async function updateRoleOperation(id: number, role: Partial<Role>): Promise<Role> {
    const { data, error } = await updateRole(id, role)
    if (error) {
        throw error
    }
    return data
}