import { useState, useEffect, useMemo } from "react";
import { type Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { useScheduleManagerData } from "../hooks/useGeneralQueries";
import { createPermissionContext } from "../utils/permissions";
import type { PermissionContext } from "../types/schedule";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);
  const { employees, roles, restaurants: locations, profile: employee, isLoading: isLoadingGeneral, isError: isErrorGeneral, error: generalError } = useScheduleManagerData();
  
  // Helper function to get role name by ID (same as schedule page)
  const getRoleName = (roleId: number): string => {
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
  };

  // Permission context (same as schedule page)
  const permissionContext: PermissionContext = useMemo(() => 
    createPermissionContext(employee?.role_id ? getRoleName(employee.role_id) : 'Unknown', employee?.role_id || 0), 
    [employee]
  );

  // Check if user is admin (can manage ingredients)
  const isAdmin = permissionContext.isAdmin;
  const canManageIngredients = isAdmin;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const client = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISH_KEY
      );
      setSupabase(client);

      client.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        // Store token for API calls
        if (session?.access_token) {
          localStorage.setItem('supabase_token', session.access_token);
          localStorage.setItem('token', session.access_token);
        }
        setLoading(false);
      });

      const {
        data: { subscription },
      } =       client.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        // Store token for API calls
        if (session?.access_token) {
          localStorage.setItem('supabase_token', session.access_token);
          localStorage.setItem('token', session.access_token);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  if (loading || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="text-neutral-900 dark:text-neutral-100 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Navigation */}
      <nav className="bg-neutral-900/20 backdrop-blur-md border-b border-neutral-700/30 dark:bg-neutral-800/20 dark:border-neutral-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">🍽️ RestaurantHub</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-neutral-300 dark:text-neutral-400">
                    Welcome, <span className="font-semibold text-neutral-900 dark:text-neutral-100">{session.user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 hover:text-accent-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-accent-500/30 dark:bg-accent-600/20 dark:hover:bg-accent-600/30 dark:text-accent-200 dark:hover:text-accent-100 dark:border-accent-600/30"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <a
                    href="/login"
                    className="nav-link text-neutral-900 dark:text-neutral-100 hover:text-primary-300 dark:hover:text-primary-400"
                  >
                    Sign In
                  </a>
                  <a
                    href="/register"
                    className="bg-gradient-primary text-neutral-900 dark:text-neutral-100 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    Get Started
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              Welcome to{" "}
              <span className="text-gradient-primary">
                RestaurantHub
              </span>
            </h1>
            <p className="text-xl text-neutral-300 dark:text-neutral-400 mb-8 max-w-3xl mx-auto">
              The ultimate restaurant management platform. Streamline your operations, 
              manage your menu, and delight your customers.
            </p>
            
            {session ? (
              <div className="space-y-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto shadow-xl dark:bg-neutral-800/20 dark:border-neutral-700/30">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">🎉 You're Successfully Logged In!</h2>
                  <p className="text-neutral-300 dark:text-neutral-400 mb-6">
                    Ready to manage your restaurant? Here's what you can do next:
                  </p>
                  
                  {/* Profile setup message */}
                  {!employee && !isLoadingGeneral && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                      <p><strong>⚠️ Profile Setup Required</strong></p>
                      <p>You need to complete your employee profile first to access all features.</p>
                      <p>Please go to your <a href="/profile" className="underline font-semibold">Profile page</a> to set up your role and location.</p>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <a href="/profile" className="bg-primary-500/20 p-6 rounded-lg border border-primary-500/30 hover:border-primary-400/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-primary-600/20 dark:border-primary-600/30 dark:hover:border-primary-500/50">
                      <div className="text-3xl mb-3">👤</div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Profile</h3>
                      <p className="text-neutral-300 dark:text-neutral-400 text-sm">Manage your employee profile</p>
                    </a>
                    
                    <a href="/schedule" className="bg-success-500/20 p-6 rounded-lg border border-success-500/30 hover:border-success-400/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-success-600/20 dark:border-success-600/30 dark:hover:border-success-500/50">
                      <div className="text-3xl mb-3">📅</div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Schedule</h3>
                      <p className="text-neutral-300 dark:text-neutral-400 text-sm">View and manage work schedules</p>
                    </a>
                    
                    {canManageIngredients && (
                      <a href="/ingredients" className="bg-warning-500/20 p-6 rounded-lg border border-warning-500/30 hover:border-warning-400/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-warning-600/20 dark:border-warning-600/30 dark:hover:border-warning-500/50">
                        <div className="text-3xl mb-3">🥘</div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Ingredients</h3>
                        <p className="text-neutral-300 dark:text-neutral-400 text-sm">Manage ingredients and inventory</p>
                      </a>
                    )}
                    
                    {canManageIngredients && (
                      <a href="/dishes" className="bg-accent-500/20 p-6 rounded-lg border border-accent-500/30 hover:border-accent-400/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-accent-600/20 dark:border-accent-600/30 dark:hover:border-accent-500/50">
                        <div className="text-3xl mb-3">🍽️</div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Dishes</h3>
                        <p className="text-neutral-300 dark:text-neutral-400 text-sm">Manage dishes and menu items</p>
                      </a>
                    )}
                    
                    <div className="bg-secondary-500/20 p-6 rounded-lg border border-secondary-500/30 shadow-lg dark:bg-secondary-600/20 dark:border-secondary-600/30">
                      <div className="text-3xl mb-3">📊</div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Analytics</h3>
                      <p className="text-neutral-300 dark:text-neutral-400 text-sm">Track your restaurant's performance</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/register"
                    className="bg-gradient-primary text-neutral-900 dark:text-neutral-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    Start Free Trial
                  </a>
                  <a
                    href="/login"
                    className="bg-white/10 hover:bg-white/20 text-neutral-900 dark:text-neutral-100 px-8 py-4 rounded-lg text-lg font-semibold border border-white/20 hover:border-white/30 transition-all duration-200 dark:bg-neutral-800/20 dark:hover:bg-neutral-700/30 dark:border-neutral-700/30 dark:hover:border-neutral-600/40"
                  >
                    Sign In
                  </a>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 mt-16">
                  <div className="text-center">
                    <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/30 dark:bg-primary-600/20 dark:border-primary-600/30">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Fast Setup</h3>
                    <p className="text-neutral-300 dark:text-neutral-400">Get started in minutes with our intuitive interface</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-success-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-success-500/30 dark:bg-success-600/20 dark:border-success-600/30">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Secure</h3>
                    <p className="text-neutral-300 dark:text-neutral-400">Your data is protected with enterprise-grade security</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-warning-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-warning-500/30 dark:bg-warning-600/20 dark:border-warning-600/30">
                      <span className="text-2xl">📱</span>
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Mobile Ready</h3>
                    <p className="text-neutral-300 dark:text-neutral-400">Access your restaurant data anywhere, anytime</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
