import supabase from "../utils/supabase";
import Employee from "../types/employee";

export async function getEmployees(): Promise<{ data: Employee[], error: any }> {
    const { data, error } = await supabase.from('employees').select('*')
    if (error) {
        throw error
    }
    return { data: data as Employee[], error }
}

export async function getEmployeeById(id: number): Promise<{ data: Employee, error: any }> {
    const { data, error } = await supabase.from('employees').select('*').eq('id', id)
    if (error) {
        throw error
    }
    return { data: data[0] as Employee, error }
}

export async function createEmployee(employee: Partial<Employee>): Promise<{ data: Employee, error: any }> {
    const { data, error } = await supabase.from('employees').insert(employee).select()   
    if (error) {
        throw error
    }
    return { data: data[0] as Employee, error }
}

export async function updateEmployee(id: number, employee: Partial<Employee>): Promise<{ data: Employee, error: any }> {
    const { data, error } = await supabase.from('employees').update(employee).eq('id', id).select()
    if (error) {
        throw error
    }
    return { data: data[0] as Employee, error }
}

export async function fireEmployee(id: number): Promise<{ data: Employee, error: any }> {
    const { data, error } = await supabase.from('employees').update({ is_featured: false }).eq('id', id).select()
    if (error) {
        throw error
    }
    return { data: data[0] as Employee, error }
}

// UUID-based functions for profile management
export async function getEmployeeByUuid(uuid: string): Promise<{ data: Employee | null, error: any }> {
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('uuid', uuid)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        return { data: data as Employee || null, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateEmployeeByUuid(uuid: string, employee: Partial<Employee>): Promise<{ data: Employee, error: any }> {
    try {
        const { data, error } = await supabase
            .from('employees')
            .update({
                ...employee,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        return { data: data as Employee, error: null };
    } catch (error) {
        return { data: null as any, error };
    }
}

export async function createEmployeeByUuid(uuid: string, employee: Partial<Employee>): Promise<{ data: Employee, error: any }> {
    try {
        const { data, error } = await supabase
            .from('employees')
            .insert({
                uuid: uuid,
                ...employee,
                created_at: new Date().toISOString(),
                updated_at: null
            })
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        return { data: data as Employee, error: null };
    } catch (error) {
        return { data: null as any, error };
    }
}