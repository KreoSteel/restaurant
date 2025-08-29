export type Pagination<T> = {
    page: number
    limit: number
    total: number
    data: T[]
}

export function paginate<T>(data: T[], page: number, limit: number): Pagination<T> {
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedData = data.slice(start, end)
    return {
        page,
        limit,
        data: paginatedData,
        total: data.length
    }
}