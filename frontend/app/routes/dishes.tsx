import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useScheduleManagerData } from '../hooks/useGeneralQueries';
import { useDishes, useCreateDish, useUpdateDish, useDeleteDish, useCategories } from '../hooks/useDishesQueries';
import { useIngredients } from '../hooks/useIngredientsQueries';
import { useAdminPermission } from '../hooks/useAdminPermission';
import type Dish from '../types/dishes';
import type { CreateDishRequest, UpdateDishRequest, DishFilters } from '../types/dishes';
import DishForm from '../components/DishForm';

// Helper function to get role name by ID (same as schedule page)
function getRoleName(roleId: number): string {
  const roleNames: Record<number, string> = {
    1: 'Restaurant Manager',
    2: 'Assistant Manager',
    3: 'Head Chef',
    4: 'Sous Chef',
    5: 'Line Cook',
    6: 'Pastry Chef',
    7: 'Prep Cook',
    8: 'Dishwasher',
    9: 'Waiter/Waitress',
    10: 'Host/Hostess',
    11: 'Bartender',
    12: 'Barback',
    13: 'Cashier',
    14: 'Cleaner',
    15: 'Sommelier',
    16: 'Food Runner',
    17: 'Busser',
    18: 'Delivery Driver',
    19: 'Security Guard',
    20: 'Maintenance',
    21: 'Manager'
  };
  return roleNames[roleId] || 'Unknown';
}

export default function Dishes() {
  const navigate = useNavigate();
  const { employees, roles, restaurants: locations, profile: employee, isLoading: isLoadingGeneral, isError: isErrorGeneral, error: generalError } = useScheduleManagerData();
  
  // Use the admin permission hook
  const { isAdmin, isLoading: isPermissionLoading, canManageDishes } = useAdminPermission();
  
  
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [filters, setFilters] = useState<DishFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);

  const { data: dishes = [], isLoading: dishesLoading, error: dishesError } = useDishes(filters);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: ingredients = [] } = useIngredients();
  const createDishMutation = useCreateDish();
  const updateDishMutation = useUpdateDish();
  const deleteDishMutation = useDeleteDish();

  // Redirect non-admin users to home
  useEffect(() => {
    if (!isPermissionLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isPermissionLoading, navigate]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchTerm || undefined,
        category_id: selectedCategory
      }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  const handleCreate = () => {
    setEditingDish(null);
    setShowForm(true);
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setShowForm(true);
  };

  const handleDelete = async (dish: Dish) => {
    if (window.confirm(`Are you sure you want to delete "${dish.name}"?`)) {
      try {
        await deleteDishMutation.mutateAsync(dish.id);
      } catch (error) {
        console.error('Error deleting dish:', error);
        alert('Failed to delete dish. Please try again.');
      }
    }
  };

  const handleFormSubmit = async (data: CreateDishRequest | UpdateDishRequest) => {
    try {
      if (editingDish) {
        await updateDishMutation.mutateAsync({
          id: editingDish.id,
          dish: data as UpdateDishRequest
        });
      } else {
        await createDishMutation.mutateAsync(data as CreateDishRequest);
      }
      setShowForm(false);
      setEditingDish(null);
    } catch (error) {
      console.error('Error saving dish:', error);
      alert('Failed to save dish. Please try again.');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingDish(null);
  };

  // Show loading state while checking permissions
  if (isPermissionLoading || isLoadingGeneral) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // This should not render for non-admin users due to redirect, but just in case
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dishes Management</h1>
              <p className="mt-2 text-gray-600">Manage restaurant dishes and menu items</p>
            </div>
            {canManageDishes && (
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Dish
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Dishes
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:w-64">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {dishesLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dishes...</p>
            </div>
          ) : dishesError ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dishes</h3>
              <p className="text-gray-600">Failed to load dishes. Please try again.</p>
            </div>
          ) : dishes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Dishes Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory ? 'No dishes match your search criteria.' : 'Get started by adding your first dish.'}
              </p>
              {canManageDishes && (
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add First Dish
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    {canManageDishes && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {dish.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {dish.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {dish.category?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${dish.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {dish.rating ? dish.rating.toFixed(1) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(dish.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      {canManageDishes && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(dish)}
                              className="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
                              disabled={updateDishMutation.isPending || deleteDishMutation.isPending}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(dish)}
                              className="text-red-600 hover:text-red-900 focus:outline-none focus:underline"
                              disabled={updateDishMutation.isPending || deleteDishMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <DishForm
            dish={editingDish}
            categories={categories}
            ingredients={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={createDishMutation.isPending || updateDishMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
