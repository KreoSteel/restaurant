import React, { useState, useEffect, useMemo, useRef } from 'react';
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

interface ScheduleManagerProps {
  userRole: string;
  userRoleId: number;
  userLocationId?: number;
  currentUserId?: string;
}

export default function ScheduleManager({ userRole, userRoleId, userLocationId, currentUserId }: ScheduleManagerProps) {
  const [scheduleWeek, setScheduleWeek] = useState<ScheduleWeek | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(userLocationId || null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // TanStack Query hooks
  const { employees, roles, restaurants: locations, isLoading: isLoadingGeneral, isError: isErrorGeneral, error: generalError } = useScheduleManagerData();
  
  // Permission context
  const permissionContext: PermissionContext = useMemo(() => 
    createPermissionContext(userRole, userRoleId), 
    [userRole, userRoleId]
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
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <div className="text-neutral-900 dark:text-neutral-100 text-lg">Loading schedule...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="bg-accent-50 border border-accent-200 rounded-xl p-6 max-w-md mx-4 dark:bg-accent-900/20 dark:border-accent-700/30">
          <div className="flex items-center space-x-2 text-accent-600 dark:text-accent-400 mb-2">
            <AlertIcon />
            <span className="font-semibold">Error</span>
          </div>
          <div className="text-neutral-900 dark:text-neutral-100">{error?.message || 'Failed to load schedule data'}</div>
        </div>
      </div>
    );
  }

  if (!hasPermission(permissionContext.permissions, 'canViewSchedule')) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-6 max-w-md mx-4 dark:bg-warning-900/20 dark:border-warning-700/30">
          <div className="flex items-center space-x-2 text-warning-600 dark:text-warning-400 mb-2">
            <AlertIcon />
            <span className="font-semibold">Access Denied</span>
          </div>
          <div className="text-neutral-900 dark:text-neutral-100">You do not have permission to view schedules.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        {scheduleWeek && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-2xl p-6 border border-success-200 shadow-sm dark:from-success-900/20 dark:to-success-800/20 dark:border-success-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-success-700 dark:text-success-300">{scheduleWeek.overall_completeness}%</div>
                  <div className="text-sm text-success-600 dark:text-success-400 font-medium">Schedule Complete</div>
                </div>
                <div className="p-3 bg-success-100 dark:bg-success-800/30 rounded-xl">
                  <CheckIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200 shadow-sm dark:from-primary-900/20 dark:to-primary-800/20 dark:border-primary-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary-700 dark:text-primary-300">{scheduleWeek.days.length}</div>
                  <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">Days Scheduled</div>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-800/30 rounded-xl">
                  <StatsIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-6 border border-secondary-200 shadow-sm dark:from-secondary-900/20 dark:to-secondary-800/20 dark:border-secondary-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-secondary-700 dark:text-secondary-300">{employees.length}</div>
                  <div className="text-sm text-secondary-600 dark:text-secondary-400 font-medium">Total Employees</div>
                </div>
                <div className="p-3 bg-secondary-100 dark:bg-secondary-800/30 rounded-xl">
                  <UserIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-2xl p-6 border border-warning-200 shadow-sm dark:from-warning-900/20 dark:to-warning-800/20 dark:border-warning-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-warning-700 dark:text-warning-300">{locations.length}</div>
                  <div className="text-sm text-warning-600 dark:text-warning-400 font-medium">Locations</div>
                </div>
                <div className="p-3 bg-warning-100 dark:bg-warning-800/30 rounded-xl">
                  <LocationIcon />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        <div className="bg-neutral-100 rounded-2xl p-8 mb-8 border border-neutral-200">
          {/* Read-only Mode Indicator */}
          {!isAdmin && (
            <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-xl dark:bg-warning-900/20 dark:border-warning-700/30">
              <div className="flex items-center space-x-3 text-warning-600 dark:text-warning-400">
                <AlertIcon />
                <div>
                  <span className="font-semibold">Your Schedule View</span>
                  <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
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
              <div className="flex items-center space-x-3 text-neutral-900 dark:text-neutral-100/90">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <LocationIcon />
                </div>
                <span className="text-sm font-semibold">Filter by Location</span>
              </div>
              <select
                value={selectedLocation || ''}
                onChange={(e) => handleLocationChange(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
              >
                <option value="" className="bg-slate-800">All Locations</option>
                {locations.map((location: Restaurant) => (
                  <option key={location.id} value={location.id} className="bg-slate-800">
                    {location.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Center - View Mode Toggle */}
            <div className="flex items-center justify-center">
              <div className="bg-white/10 rounded-xl p-1 border border-white/20">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'week' 
                      ? 'bg-primary-500 text-white shadow-lg' 
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  Week View
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                    viewMode === 'day' 
                      ? 'bg-primary-500 text-white shadow-lg' 
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
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
                className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-all duration-200 border border-neutral-300 hover:border-neutral-400"
              >
                <svg className="w-5 h-5 text-neutral-900 dark:text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center min-w-[200px]">
                <div className="text-xl font-bold text-neutral-900">
                  {new Date(weekDates.start_date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })} - {new Date(weekDates.end_date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-sm text-neutral-600 font-medium">Current Week</div>
              </div>
              
              <button
                onClick={() => handleWeekChange('next')}
                className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-all duration-200 border border-neutral-300 hover:border-neutral-400"
              >
                <svg className="w-5 h-5 text-neutral-900 dark:text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Row - Status */}
          {scheduleWeek && (
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-3 px-6 py-3 rounded-xl ${
                  getScheduleStatusColor(scheduleWeek.overall_completeness) === 'green' ? 'bg-success-500/20 text-success-300 border border-success-500/30 dark:bg-success-600/20 dark:text-success-200 dark:border-success-600/30' :
                  getScheduleStatusColor(scheduleWeek.overall_completeness) === 'yellow' ? 'bg-warning-500/20 text-warning-300 border border-warning-500/30 dark:bg-warning-600/20 dark:text-warning-200 dark:border-warning-600/30' :
                  getScheduleStatusColor(scheduleWeek.overall_completeness) === 'orange' ? 'bg-warning-500/20 text-warning-300 border border-warning-500/30 dark:bg-warning-600/20 dark:text-warning-200 dark:border-warning-600/30' : 
                  'bg-accent-500/20 text-accent-300 border border-accent-500/30 dark:bg-accent-600/20 dark:text-accent-200 dark:border-accent-600/30'
                }`}>
                  {getScheduleStatusColor(scheduleWeek.overall_completeness) === 'red' && <AlertIcon />}
                  <span className="font-semibold text-lg">
                    {getScheduleStatusText(scheduleWeek.overall_completeness)} ({scheduleWeek.overall_completeness}%)
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-neutral-600 font-medium">
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
                currentUserId={currentUserId}
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
                        ? 'bg-primary-500 text-neutral-900 dark:text-neutral-100 dark:bg-primary-600'
                        : isToday
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30 dark:bg-primary-600/20 dark:text-primary-200 dark:border-primary-600/30'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
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
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
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
  currentUserId,
  isAdmin
}: ModernDayCardProps) {
  const statusColor = getScheduleStatusColor(day.validation.completenessPercentage);
  const isToday = new Date(day.date).toDateString() === new Date().toDateString();
  const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;

  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl border transition-all duration-200 hover:bg-white/15 ${
      isToday ? 'border-purple-400/50 shadow-lg shadow-purple-500/20' :
      statusColor === 'green' ? 'border-green-400/30' :
      statusColor === 'yellow' ? 'border-yellow-400/30' :
      statusColor === 'orange' ? 'border-orange-400/30' : 'border-red-400/30'
    } ${isExpanded ? 'col-span-full' : ''}`}>
      {/* Day Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-lg ${
              isToday ? 'text-purple-300' : 'text-neutral-900 dark:text-neutral-100'
            }`}>
              {new Date(day.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
              {isToday && <span className="ml-2 text-xs bg-purple-500/20 px-2 py-1 rounded-full">Today</span>}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center space-x-2">
              <LocationIcon />
              <span>{day.location_name}</span>
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            statusColor === 'green' ? 'bg-green-500/20 text-green-400' :
            statusColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
            statusColor === 'orange' ? 'bg-orange-500/20 text-orange-400' : 
            'bg-red-500/20 text-red-400'
          }`}>
            {statusColor === 'red' && <AlertIcon />}
            <span>{day.validation.completenessPercentage}% Complete</span>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className={`p-4 space-y-3 ${isExpanded ? 'max-h-none' : 'max-h-96 overflow-y-auto'}`}>
        {day.role_requirements.length > 0 ? (
          day.role_requirements.map(requirement => (
            <ModernRoleItem
              key={requirement.role_id}
              requirement={requirement}
              employees={employees}
              roles={roles}
              permissionContext={permissionContext}
              date={day.date}
              onAssignEmployee={onAssignEmployee}
              onUnassignEmployee={onUnassignEmployee}
              isWeekend={isWeekend}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))
        ) : !isAdmin ? (
          <div className="text-center py-8 text-neutral-700 dark:text-neutral-300">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-sm">No one is scheduled for this day</div>
          </div>
        ) : null}
      </div>

      {/* Conflicts */}
      {day.validation.conflicts.length > 0 && (
        <div className="p-4 border-t border-white/10 bg-red-500/10">
          <div className="flex items-center space-x-2 text-red-400 text-sm font-medium mb-2">
            <AlertIcon />
            <span>Conflicts</span>
          </div>
          <div className="space-y-1">
            {day.validation.conflicts.map((conflict, index) => (
              <div key={index} className="text-xs text-red-300 bg-red-500/10 px-2 py-1 rounded">
                {conflict.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Modern Role Item Component
interface ModernRoleItemProps {
  requirement: RoleRequirement;
  employees: Employee[];
  roles: Role[];
  permissionContext: PermissionContext;
  date: string;
  onAssignEmployee: (date: string, roleId: number, employeeId: string) => void;
  onUnassignEmployee: (date: string, employeeId: string) => void;
  isWeekend: boolean;
  currentUserId?: string;
  isAdmin: boolean;
}

function ModernRoleItem({ 
  requirement, 
  employees, 
  roles, 
  permissionContext, 
  date, 
  onAssignEmployee, 
  onUnassignEmployee,
  isWeekend,
  currentUserId,
  isAdmin
}: ModernRoleItemProps) {
  const availableEmployees = employees.filter(emp => emp.role_id === requirement.role_id);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if this assignment is for the current user
  const isCurrentUserAssignment = currentUserId && requirement.assigned_employee_id === currentUserId;

  // Close dropdown when clicking outside
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
      isCurrentUserAssignment ? 'bg-blue-500/30 border-blue-400/70 shadow-xl shadow-blue-500/30 ring-2 ring-blue-400/50' :
      requirement.assigned ? 'bg-green-500/10 border-green-400/30' : 
      requirement.required ? 'bg-red-500/10 border-red-400/30' : 
      'bg-white/5 border-white/10 hover:bg-white/10'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">
              {getRoleIcon(requirement.role_name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
                  {requirement.role_name}
                </span>
                {requirement.required && (
                  <span className="text-red-400 text-sm">*</span>
                )}
                {requirement.assigned && (
                  <div className="flex items-center space-x-1">
                    <CheckIcon />
                    <span className="text-green-400 text-sm">Assigned</span>
                  </div>
                )}
              </div>
              
              {requirement.assigned && requirement.assigned_employee_name && (
                <div className={`text-sm mt-1 flex items-center space-x-2 ${
                  isCurrentUserAssignment ? 'text-blue-300 font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                }`}>
                  <span>{requirement.assigned_employee_name}</span>
                  {isCurrentUserAssignment ? (
                    <span className="text-xs bg-blue-500/30 px-2 py-1 rounded-full">
                      You
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-900 dark:text-neutral-100/50">👥</span>
                  )}
                </div>
              )}
              
              {!requirement.assigned && requirement.required && (
                <div className="text-sm text-red-400 mt-1">
                  Required position - needs assignment
                </div>
              )}
            </div>
          </div>

          {isAdmin && hasPermission(permissionContext.permissions, 'canAssignEmployees') && (
            <div className="flex items-center space-x-2">
              {requirement.assigned ? (
                <button
                  onClick={() => onUnassignEmployee(date, requirement.assigned_employee_id!)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Remove assignment"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                  >
                    <PlusIcon />
                    <span>Assign Employee</span>
                  </button>
                  
                  {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-10">
                      <div className="p-3">
                        <div className="text-sm text-neutral-900 dark:text-neutral-100/60 mb-3 px-2">Select employee for {requirement.role_name}:</div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {availableEmployees.length > 0 ? (
                            availableEmployees.map(employee => (
                              <button
                                key={employee.uuid}
                                onClick={() => {
                                  onAssignEmployee(date, requirement.role_id, employee.uuid);
                                  setIsOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded text-sm text-neutral-900 dark:text-neutral-100 hover:bg-white/10 transition-colors flex items-center space-x-2"
                              >
                                <span className="text-lg">{getRoleIcon(requirement.role_name)}</span>
                                <span>{employee.full_name}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100/60 text-center">
                              No employees available for this role
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