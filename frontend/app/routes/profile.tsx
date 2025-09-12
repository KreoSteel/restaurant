import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { profileApi } from '../services/profileApi';
import type { User } from '@supabase/supabase-js';
import type Employee from '../types/employee';
import type Role from '../types/roles';
import type Restaurant from '../types/restaurants';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    email: '',
    is_featured: false,
    role_id: '',
    location_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        setUser(null);
        return;
      }

      setUser(user);

      // Store token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token);
      }

      // Load employee profile
      try {
        const profileResponse = await profileApi.getProfile();
        setEmployee(profileResponse.data);
        populateForm(profileResponse.data);
      } catch (profileError: any) {
        if (profileError.response?.status === 404) {
          // No profile exists yet - this is normal for new users
          setEmployee(null);
          populateForm(null);
        } else {
          throw profileError;
        }
      }

      // Load roles and restaurants
      console.log('Loading roles and restaurants...');
      const [rolesResult, restaurantsResult] = await Promise.all([
        supabase.from('role').select('*'),
        supabase.from('restaurant_locations').select('*')
      ]);

      console.log('Roles result:', rolesResult);
      console.log('Restaurants result:', restaurantsResult);

      if (rolesResult.error) throw rolesResult.error;
      if (restaurantsResult.error) throw restaurantsResult.error;

      setRoles(rolesResult.data || []);
      setRestaurants(restaurantsResult.data || []);
      
      console.log('Roles set to:', rolesResult.data);
      console.log('Restaurants set to:', restaurantsResult.data);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (employeeData: Employee | null) => {
    console.log('populateForm called with:', employeeData);
    if (employeeData) {
      const newFormData = {
        full_name: employeeData.full_name || '',
        age: employeeData.age?.toString() || '',
        email: employeeData.email || user?.email || '',
        is_featured: employeeData.is_featured ?? false,
        role_id: employeeData.role_id?.toString() || '',
        location_id: employeeData.location_id?.toString() || ''
      };
      console.log('Setting form data to:', newFormData);
      setFormData(newFormData);
    } else {
      const newFormData = {
        full_name: '',
        age: '',
        email: user?.email || '',
        is_featured: false,
        role_id: '',
        location_id: ''
      };
      console.log('Setting form data to (no employee):', newFormData);
      setFormData(newFormData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const employeeData = {
        full_name: formData.full_name.trim(),
        age: formData.age ? parseInt(formData.age) : undefined,
        email: formData.email.trim(),
        is_featured: formData.is_featured,
        role_id: formData.role_id ? parseInt(formData.role_id) : undefined,
        location_id: formData.location_id ? parseInt(formData.location_id) : undefined
      };

      // Update or create profile
      const response = await profileApi.updateProfile(employeeData);
      setEmployee(response.data);
      setIsEditing(false);
      
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getRoleName = (roleId: number | null) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'No Role Assigned';
  };

  const getRestaurantName = (locationId: number | null) => {
    const restaurant = restaurants.find(r => r.id === locationId);
    return restaurant ? restaurant.address : 'No Location Assigned';
  };

  if (loading || roles.length === 0 || restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-900 dark:text-neutral-100">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Please log in</h1>
          <p className="text-neutral-300 mb-4">You need to be logged in to view your profile.</p>
          <a
            href="/login"
            className="bg-gradient-primary text-neutral-900 dark:text-neutral-100 px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const hasCompleteProfile = employee && employee.full_name;

  return (
    <div className="min-h-screen bg-gradient-dark py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">My Profile</h1>
              <p className="mt-2 text-neutral-700 dark:text-neutral-300">Manage your employee information</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-accent-600 hover:bg-accent-700 text-neutral-900 dark:text-neutral-100 font-medium py-2 px-4 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-accent-50 border border-accent-200 rounded-lg p-4 dark:bg-accent-900/20 dark:border-accent-700/30">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-accent-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-accent-800 dark:text-accent-200">Error</h3>
                <div className="mt-2 text-sm text-accent-700 dark:text-accent-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200 overflow-hidden dark:bg-neutral-800/95 dark:border-neutral-700">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">Employee Profile</h2>
              {hasCompleteProfile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-primary text-neutral-900 dark:text-neutral-100 px-4 py-2 rounded-custom font-semibold transition-all duration-200 hover:shadow-custom hover:scale-105"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-4">
            {isEditing ? (
              /* Edit Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      min="16"
                      max="100"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role_id"
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    >
                      <option value="">Select a role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name} - ${role.salary_per_day}/day
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <select
                      id="location_id"
                      name="location_id"
                      value={formData.location_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    >
                      <option value="">Select a location</option>
                      {restaurants.map(restaurant => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded "
                    />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                      Featured Employee
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      populateForm(employee);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : hasCompleteProfile ? (
              /* Profile Display */
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-700">
                      {employee?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {employee?.full_name}
                    </h3>
                    <p className="text-gray-600">{employee?.email}</p>
                    {employee?.is_featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Featured Employee
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Personal Information</h4>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-900">Age</dt>
                        <dd className="text-sm text-gray-600">{employee?.age || 'Not specified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-900">Email</dt>
                        <dd className="text-sm text-gray-600">{employee?.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-900">Member Since</dt>
                        <dd className="text-sm text-gray-600">
                          {employee?.created_at ? new Date(employee.created_at).toLocaleDateString() : 'Unknown'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Work Information</h4>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-900">Role</dt>
                        <dd className="text-sm text-gray-600">{getRoleName(employee?.role_id || null)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-900">Location</dt>
                        <dd className="text-sm text-gray-600">{getRestaurantName(employee?.location_id || null)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-900">Status</dt>
                        <dd className="text-sm text-gray-600">
                          {employee?.is_featured ? 'Featured Employee' : 'Regular Employee'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ) : (
              /* Complete Profile Setup */
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile</h3>
                <p className="text-gray-600 mb-4">Set up your employee profile to get started.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-neutral-900 dark:text-neutral-100 font-medium py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Set Up Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}