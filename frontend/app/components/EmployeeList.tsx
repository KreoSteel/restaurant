import type Employee from '../types/employee';
import type Role from '../types/roles';
import type Restaurant from '../types/restaurants';

interface EmployeeListProps {
  employees: Employee[];
  roles: Role[];
  restaurants: Restaurant[];
  loading: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (uuid: string) => void;
}

export default function EmployeeList({ 
  employees, 
  roles, 
  restaurants, 
  loading, 
  onEdit, 
  onDelete 
}: EmployeeListProps) {
  const getRoleName = (roleId: number | null) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'No Role';
  };

  const getRestaurantName = (locationId: number | null) => {
    const restaurant = restaurants.find(r => r.id === locationId);
    return restaurant ? restaurant.address : 'No Location';
  };

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 text-center">
          <div className="text-gray-500">No employees found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Employees</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          List of all restaurant employees
        </p>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {employees.map((employee) => (
          <li key={employee.uuid} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {employee.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {employee.full_name || 'Unnamed Employee'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {employee.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Age: {employee.age || 'N/A'}</span>
                  <span>Role: {getRoleName(employee.role_id)}</span>
                  <span>Location: {getRestaurantName(employee.location_id)}</span>
                  {employee.is_featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(employee)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(employee.uuid)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

