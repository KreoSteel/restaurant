import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { safeLocalStorage } from '../utils/storage';
import { useScheduleData, useAssignEmployee, useUnassignEmployee } from '../hooks/useScheduleQueries';
import { useScheduleManagerData } from '../hooks/useGeneralQueries';
import { createPermissionContext, hasPermission } from '../utils/permissions';
import { validateScheduleWeek, createRoleRequirements, getScheduleStatusColor, getScheduleStatusText } from '../utils/scheduleValidation';
import type { 
  ScheduleWeek, 
  ScheduleDay, 
  ScheduleAssignment, 
  RoleRequirement,
  PermissionContext,
  ScheduleFilters 
} from '../types/schedule';
import type Employee from '../types/employee';
import type Role from '../types/roles';
import type Restaurant from '../types/restaurants';
import type { User } from '@supabase/supabase-js';

// Modern Icons
const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const StatsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function Schedule() {
  const [user, setUser] = useState<User | null>(null);
  const [scheduleWeek, setScheduleWeek] = useState<ScheduleWeek | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // TanStack Query hooks
  const { employees, roles, restaurants: locations, profile: employee, isLoading: isLoadingGeneral, isError: isErrorGeneral, error: generalError } = useScheduleManagerData();

  // Permission context
  const permissionContext: PermissionContext = useMemo(() => 
    createPermissionContext(employee?.role_id ? getRoleName(employee.role_id) : 'Unknown', employee?.role_id || 0), 
    [employee]
  );

  // Check if user is admin (can edit)
  const isAdmin = permissionContext.isAdmin;

  // Generate week dates
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return {
      start_date: dates[0],
      end_date: dates[6],
      dates
    };
  }, [currentWeek]);

  // Schedule data query
  const scheduleFilters: ScheduleFilters = useMemo(() => ({
    start_date: weekDates.start_date,
    end_date: weekDates.end_date,
    location_id: selectedLocation || undefined
  }), [weekDates, selectedLocation]);

  const { 
    shifts, 
    assignments, 
    employeeSchedules, 
    isLoading: isLoadingSchedule, 
    isError: isErrorSchedule, 
    error: scheduleError 
  } = useScheduleData(scheduleFilters);

  // Mutations
  const assignEmployeeMutation = useAssignEmployee();
  const unassignEmployeeMutation = useUnassignEmployee();

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Auto-select user's location when employee profile loads
  useEffect(() => {
    if (employee?.location_id && !selectedLocation) {
      setSelectedLocation(employee.location_id);
    }
  }, [employee?.location_id, selectedLocation]);

  const loadUserData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        setUser(null);
        return;
      }

      setUser(user);

      // Get employee profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        safeLocalStorage.setItem('supabase_token', session.access_token);
        safeLocalStorage.setItem('token', session.access_token);
      }

    } catch (err: any) {
      console.error('Error loading user data:', err);
    }
  };

  // Create schedule week from query data
  useEffect(() => {
    if (assignments.length > 0 || shifts.length > 0) {
      // Group assignments by date
      const assignmentsByDate = new Map<string, ScheduleAssignment[]>();
      assignments.forEach(assignment => {
        if (!assignmentsByDate.has(assignment.shift_date)) {
          assignmentsByDate.set(assignment.shift_date, []);
        }
        assignmentsByDate.get(assignment.shift_date)!.push(assignment);
      });

      // Create schedule days
      const days: ScheduleDay[] = weekDates.dates.map(date => {
        const dayAssignments = assignmentsByDate.get(date) || [];
        let roleRequirements = createRoleRequirements(dayAssignments, roles, employees);
        
        // For non-admin users, filter to only show assigned positions (so they can see who they work with)
        if (!isAdmin) {
          roleRequirements = roleRequirements.filter(requirement => 
            requirement.assigned
          );
        }
        
        const location = locations.find((loc: Restaurant) => loc.id === selectedLocation);
        
        return {
          date,
          location_id: selectedLocation || 0,
          location_name: location?.address || 'All Locations',
          role_requirements: roleRequirements,
          assignments: dayAssignments,
          validation: {
            isComplete: false,
            missingRoles: [],
            conflicts: [],
            completenessPercentage: 0
          }
        };
      });

      // Validate each day
      days.forEach(day => {
        day.validation = validateScheduleWeek({ 
          start_date: weekDates.start_date, 
          end_date: weekDates.end_date, 
          days: [day], 
          overall_completeness: 0 
        }, employees, roles);
      });

      const overallCompleteness = days.reduce((sum, day) => sum + day.validation.completenessPercentage, 0) / days.length;

      setScheduleWeek({
        start_date: weekDates.start_date,
        end_date: weekDates.end_date,
        days,
        overall_completeness: Math.round(overallCompleteness)
      });
    }
  }, [assignments, shifts, roles, employees, locations, selectedLocation, weekDates]);

  const handleLocationChange = (locationId: number | null) => {
    setSelectedLocation(locationId);
    setSelectedDate(null);
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
    setSelectedDate(null);
  };

  const handleAssignEmployee = async (date: string, roleId: number, employeeId: string) => {
    if (!hasPermission(permissionContext.permissions, 'canAssignEmployees')) {
      return;
    }

    if (!selectedLocation) {
      return;
    }

    assignEmployeeMutation.mutate({
      shift_date: date,
      location_id: selectedLocation,
      employee_id: employeeId
    });
  };

  const handleUnassignEmployee = async (date: string, employeeId: string) => {
    if (!hasPermission(permissionContext.permissions, 'canAssignEmployees')) {
      return;
    }

    if (!selectedLocation) {
      return;
    }

    unassignEmployeeMutation.mutate({
      shift_date: date,
      location_id: selectedLocation,
      employee_id: employeeId
    });
  };

  const isLoading = isLoadingGeneral || isLoadingSchedule;
  const isError = isErrorGeneral || isErrorSchedule;
  const error = generalError || scheduleError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="flex flex-col items-center text-neutral-300">
          <svg className="animate-spin h-10 w-10 text-primary-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg">Loading schedule data...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="bg-accent-500/20 border border-accent-500/50 text-accent-300 px-6 py-4 rounded-custom flex items-center space-x-3">
          <AlertIcon />
          <div>
            <strong className="font-semibold">Error:</strong> {error?.message || 'Failed to load schedule data'}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !employee) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="bg-warning-500/20 border border-warning-500/50 text-warning-300 px-6 py-4 rounded-custom flex items-center space-x-3">
          <AlertIcon />
          <div>
            <strong className="font-semibold">Access Required:</strong> Please log in and complete your employee profile to access the schedule.
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission(permissionContext.permissions, 'canViewSchedule')) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="bg-warning-500/20 border border-warning-500/50 text-warning-300 px-6 py-4 rounded-custom flex items-center space-x-3">
          <AlertIcon />
          <div>
            <strong className="font-semibold">Access Denied:</strong> You do not have permission to view schedules.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        {scheduleWeek && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-700">{scheduleWeek.overall_completeness}%</div>
                  <div className="text-sm text-green-600 font-medium">Schedule Complete</div>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-700">{scheduleWeek.days.length}</div>
                  <div className="text-sm text-blue-600 font-medium">Days Scheduled</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <StatsIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-700">{employees.length}</div>
                  <div className="text-sm text-purple-600 font-medium">Total Employees</div>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <UserIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-700">{locations.length}</div>
                  <div className="text-sm text-orange-600 font-medium">Locations</div>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <LocationIcon />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        <div className="bg-neutral-100 rounded-custom-lg p-8 mb-8 border border-neutral-200 shadow-custom">
          {/* Read-only Mode Indicator */}
          {!isAdmin && (
            <div className="mb-6 p-4 bg-warning-100 border border-warning-300 rounded-custom">
              <div className="flex items-center space-x-3 text-warning-700">
                <AlertIcon />
                <div>
                  <span className="font-semibold">Your Schedule View</span>
                  <p className="text-sm text-warning-600 mt-1">
                    You can see all assigned shifts to know who you're working with. Your assignments are highlighted in blue. Only Restaurant Managers and Assistant Managers can edit schedules.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Row - Filters and Navigation */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-6">
            {/* Left Side - Location Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <LocationIcon />
                </div>
                <span className="text-sm font-semibold">Select Location *</span>
              </div>
              <select
                value={selectedLocation || ''}
                onChange={(e) => handleLocationChange(e.target.value ? parseInt(e.target.value) : null)}
                className={`bg-white border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[200px] ${
                  !selectedLocation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a location...</option>
                {locations.map((location: Restaurant) => (
                  <option key={location.id} value={location.id}>
                    {location.address}
                  </option>
                ))}
              </select>
              {!selectedLocation && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertIcon />
                  <span>Location required for assignments</span>
                </div>
              )}
            </div>

            {/* Center - View Mode Toggle */}
            <div className="flex items-center justify-center">
              <div className="bg-gray-200 rounded-xl p-1 border border-gray-300">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'week' 
                      ? 'bg-purple-500 text-neutral-900 dark:text-neutral-100 shadow-lg' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Week View
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'day' 
                      ? 'bg-purple-500 text-neutral-900 dark:text-neutral-100 shadow-lg' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Day View
                </button>
              </div>
            </div>

            {/* Right Side - Week Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleWeekChange('prev')}
                className="p-3 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 border border-gray-300 hover:border-gray-400"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center min-w-[200px]">
                <div className="text-xl font-bold text-gray-900">
                  {new Date(weekDates.start_date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })} - {new Date(weekDates.end_date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-600 font-medium">Current Week</div>
              </div>
              
              <button
                onClick={() => handleWeekChange('next')}
                className="p-3 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 border border-gray-300 hover:border-gray-400"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Row - Status */}
          {scheduleWeek && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-3 px-6 py-3 rounded-xl ${
                  getScheduleStatusColor(scheduleWeek.overall_completeness) === 'green' ? 'bg-green-100 text-green-700 border border-green-300' :
                  getScheduleStatusColor(scheduleWeek.overall_completeness) === 'yellow' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                  getScheduleStatusColor(scheduleWeek.overall_completeness) === 'orange' ? 'bg-orange-100 text-orange-700 border border-orange-300' : 
                  'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {getScheduleStatusColor(scheduleWeek.overall_completeness) === 'red' && <AlertIcon />}
                  <span className="font-semibold text-lg">
                    {getScheduleStatusText(scheduleWeek.overall_completeness)} ({scheduleWeek.overall_completeness}%)
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 font-medium">
                {scheduleWeek.days.length} days scheduled • {employees.length} employees available
              </div>
            </div>
          )}
        </div>

        {/* Schedule Grid */}
        {scheduleWeek && viewMode === 'week' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {scheduleWeek.days.map((day, index) => (
              <ModernDayCard
                key={day.date}
                day={day}
                employees={employees}
                roles={roles}
                permissionContext={permissionContext}
                onAssignEmployee={handleAssignEmployee}
                onUnassignEmployee={handleUnassignEmployee}
                selectedLocation={selectedLocation}
                currentUserId={employee?.uuid}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        {/* Day View */}
        {scheduleWeek && viewMode === 'day' && (
          <div className="space-y-6">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {scheduleWeek.days.map((day) => {
                const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedDate === day.date
                        ? 'bg-purple-500 se 900 dark:text-neutral-100'
                        : isToday
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    {isToday && <span className="ml-1 text-xs">Today</span>}
                  </button>
                );
              })}
      </div>

            {selectedDate && (
              <ModernDayCard
                day={scheduleWeek.days.find(d => d.date === selectedDate)!}
                employees={employees}
                roles={roles}
                permissionContext={permissionContext}
                onAssignEmployee={handleAssignEmployee}
                onUnassignEmployee={handleUnassignEmployee}
                isExpanded={true}
                selectedLocation={selectedLocation}
                currentUserId={employee?.uuid}
                isAdmin={isAdmin}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get role name by ID
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
    19: 'Security Guard'
  };

  return roleNames[roleId] || 'Unknown Role';
}

// Modern Day Card Component
interface ModernDayCardProps {
  day: ScheduleDay;
  employees: Employee[];
  roles: Role[];
  permissionContext: PermissionContext;
  onAssignEmployee: (date: string, roleId: number, employeeId: string) => void;
  onUnassignEmployee: (date: string, employeeId: string) => void;
  isExpanded?: boolean;
  selectedLocation?: number | null;
  currentUserId?: string;
  isAdmin: boolean;
}

function ModernDayCard({ 
  day, 
  employees, 
  roles, 
  permissionContext, 
  onAssignEmployee, 
  onUnassignEmployee,
  isExpanded = false,
  selectedLocation,
  currentUserId,
  isAdmin
}: ModernDayCardProps) {
  const statusColor = getScheduleStatusColor(day.validation.completenessPercentage);
  const isToday = new Date(day.date).toDateString() === new Date().toDateString();
  const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-lg ${
      isToday ? 'border-purple-300 shadow-lg shadow-purple-100' :
      statusColor === 'green' ? 'border-green-200' :
      statusColor === 'yellow' ? 'border-yellow-200' :
      statusColor === 'orange' ? 'border-orange-200' : 
      'border-red-200'
    } ${isExpanded ? 'col-span-full' : ''}`}>
      {/* Day Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className={`font-bold text-lg ${
              isToday ? 'text-purple-700' : 'text-gray-900'
            }`}>
              {new Date(day.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
              {isToday && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Today</span>}
            </h3>
          </div>
          
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            statusColor === 'green' ? 'bg-green-100 text-green-700' :
            statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
            statusColor === 'orange' ? 'bg-orange-100 text-orange-700' : 
            'bg-red-100 text-red-700'
          }`}>
            {statusColor === 'red' && <AlertIcon />}
            <span>{day.validation.completenessPercentage}%</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 flex items-center space-x-2">
          <LocationIcon />
          <span>{day.location_name}</span>
        </div>
      </div>

      {/* Roles List */}
      <div className={`p-4 space-y-3 ${isExpanded ? 'max-h-none' : 'max-h-96 overflow-y-auto'}`}>
        {day.role_requirements.length > 0 ? (
          day.role_requirements.map(requirement => (
            <ModernRoleRequirementItem
              key={requirement.role_id}
              requirement={requirement}
              employees={employees}
              roles={roles}
              permissionContext={permissionContext}
              date={day.date}
              onAssignEmployee={onAssignEmployee}
              onUnassignEmployee={onUnassignEmployee}
              isWeekend={isWeekend}
              selectedLocation={selectedLocation}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))
        ) : !isAdmin ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-sm">No one is scheduled for this day</div>
          </div>
        ) : null}
      </div>

      {/* Conflicts */}
      {day.validation.conflicts.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-red-50">
          <div className="flex items-center space-x-2 text-red-600 text-sm font-medium mb-2">
            <AlertIcon />
            <span>Conflicts</span>
          </div>
          <div className="space-y-1">
            {day.validation.conflicts.map((conflict, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                {conflict.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Modern Role Requirement Item Component
interface ModernRoleRequirementItemProps {
  requirement: RoleRequirement;
  employees: Employee[];
  roles: Role[];
  permissionContext: PermissionContext;
  date: string;
  onAssignEmployee: (date: string, roleId: number, employeeId: string) => void;
  onUnassignEmployee: (date: string, employeeId: string) => void;
  isWeekend: boolean;
  selectedLocation?: number | null;
  currentUserId?: string;
  isAdmin: boolean;
}

function ModernRoleRequirementItem({
  requirement,
  employees,
  roles,
  permissionContext,
  date,
  onAssignEmployee,
  onUnassignEmployee,
  isWeekend,
  selectedLocation,
  currentUserId,
  isAdmin
}: ModernRoleRequirementItemProps) {
  // Filter employees by role and location (if location is selected)
  const availableEmployees = employees.filter(emp => {
    const roleMatch = emp.role_id === requirement.role_id;
    const locationMatch = !selectedLocation || emp.location_id === selectedLocation;
    return roleMatch && locationMatch;
  });

  // Check if this assignment is for the current user
  const isCurrentUserAssignment = currentUserId && requirement.assigned_employee_id === currentUserId;
  
  const role = roles.find(r => r.id === requirement.role_id);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getRoleIcon = (roleName: string) => {
    const roleIcons: { [key: string]: string } = {
      'Restaurant Manager': '👨‍💼',
      'Assistant Manager': '👩‍💼',
      'Head Chef': '👨‍🍳',
      'Sous Chef': '👩‍🍳',
      'Line Cook': '👨‍🍳',
      'Pastry Chef': '🧁',
      'Prep Cook': '🥕',
      'Dishwasher': '🍽️',
      'Waiter/Waitress': '🍽️',
      'Host/Hostess': '👋',
      'Bartender': '🍸',
      'Barback': '🍻',
      'Cashier': '💳',
      'Cleaner': '🧹',
      'Sommelier': '🍷',
      'Food Runner': '🏃‍♂️',
      'Busser': '🧽',
      'Delivery Driver': '🚗',
      'Security Guard': '🛡️'
    };
    return roleIcons[roleName] || '👤';
  };

  return (
    <div className={`group relative rounded-lg border transition-all duration-200 ${
      isCurrentUserAssignment ? 'bg-blue-200 border-blue-400 shadow-lg shadow-blue-300 ring-2 ring-blue-300' :
      requirement.assigned ? 'bg-green-50 border-green-200' :
      requirement.required ? 'bg-red-50 border-red-200' :
      'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-lg">
              {getRoleIcon(requirement.role_name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 text-sm">
                  {requirement.role_name}
                </span>
                {requirement.required && (
                  <span className="text-red-500 text-xs">*</span>
                )}
                {requirement.assigned && (
                  <div className="flex items-center space-x-1">
                    <CheckIcon />
                    <span className="text-green-600 text-xs">Assigned</span>
                  </div>
                )}
              </div>

              {requirement.assigned && requirement.assigned_employee_name && (
                <div className={`text-xs mt-1 flex items-center space-x-2 ${
                  isCurrentUserAssignment ? 'text-blue-700 font-semibold' : 'text-gray-600'
                }`}>
                  <span>{requirement.assigned_employee_name}</span>
                  {isCurrentUserAssignment ? (
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">👥</span>
                  )}
                </div>
              )}

              {!requirement.assigned && requirement.required && (
                <div className="text-xs text-red-600 mt-1">
                  Required position
                </div>
              )}
            </div>
          </div>

          {isAdmin && hasPermission(permissionContext.permissions, 'canAssignEmployees') && (
            <div className="flex items-center space-x-2">
              {requirement.assigned ? (
                <button
                  onClick={() => onUnassignEmployee(date, requirement.assigned_employee_id!)}
                  className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Remove assignment"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={!selectedLocation}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      !selectedLocation 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                    title={!selectedLocation ? 'Please select a location first' : 'Assign employee'}
                  >
                    <PlusIcon />
                    <span>Assign</span>
                  </button>

                  {isOpen && (
                    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 mb-2 px-2">Select employee:</div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {availableEmployees.length > 0 ? (
                            availableEmployees.map(employee => (
                              <button
                                key={employee.uuid}
                                onClick={() => {
                                  onAssignEmployee(date, requirement.role_id, employee.uuid);
                                  setIsOpen(false);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                {employee.full_name}
                              </button>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              No employees available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}