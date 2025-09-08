export default interface Employee {
    uuid: string;
    created_at: string;
    updated_at: string | null;
    full_name: string | null;
    age: number | null;
    email: string | null;
    password_hashed: string | null;
    is_featured: boolean | null;
    role_id: number | null;
    location_id: number | null;
}

export interface CreateEmployeeRequest {
    full_name: string;
    age?: number;
    email: string;
    is_featured?: boolean;
    role_id?: number;
    location_id?: number;
}

export interface UpdateEmployeeRequest {
    full_name?: string;
    age?: number;
    email?: string;
    is_featured?: boolean;
    role_id?: number;
    location_id?: number;
}

