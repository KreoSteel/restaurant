import supabase from "../utils/supabase";
import Role from "../types/roles";

export async function getRoles(): Promise<{ data: Role[], error: any }> {
    const { data, error } = await supabase.from('role').select('*')
    if (error) {
        throw error
    }
    return { data: data as Role[], error }
}

export async function getRoleById(id: number): Promise<{ data: Role, error: any }> {
    const { data, error } = await supabase.from('role').select('*').eq('id', id)
    if (error) {
        throw error
    }
    return { data: data[0] as Role, error }
}

export async function createRole(role: Partial<Role>): Promise<{ data: Role, error: any }> {
    const { data, error } = await supabase.from('role').insert(role).select()
    if (error) {
        throw error
    }
    return { data: data[0] as Role, error }
}

export async function updateRole(id: number, role: Partial<Role>): Promise<{ data: Role, error: any }> {
    const { data, error } = await supabase.from('role').update(role).eq('id', id).select()
    if (error) {
        throw error
    }
    return { data: data[0] as Role, error }
}