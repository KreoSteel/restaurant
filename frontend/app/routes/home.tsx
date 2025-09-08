import { useState, useEffect } from "react";
import { type Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const client = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISH_KEY
      );
      setSupabase(client);

      client.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        setSession(session);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-white">🍽️ RestaurantHub</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-300">
                    Welcome, <span className="font-semibold text-white">{session.user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-red-500/30"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <a
                    href="/login"
                    className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
                  >
                    Sign In
                  </a>
                  <a
                    href="/register"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
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
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                RestaurantHub
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The ultimate restaurant management platform. Streamline your operations, 
              manage your menu, and delight your customers.
            </p>
            
            {session ? (
              <div className="space-y-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold text-white mb-4">🎉 You're Successfully Logged In!</h2>
                  <p className="text-gray-300 mb-6">
                    Ready to manage your restaurant? Here's what you can do next:
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-500/30">
                      <div className="text-3xl mb-3">📊</div>
                      <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                      <p className="text-gray-300 text-sm">Track your restaurant's performance</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-6 rounded-xl border border-green-500/30">
                      <div className="text-3xl mb-3">🍽️</div>
                      <h3 className="text-lg font-semibold text-white mb-2">Menu Management</h3>
                      <p className="text-gray-300 text-sm">Update your menu items and prices</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-500/30">
                      <div className="text-3xl mb-3">👥</div>
                      <h3 className="text-lg font-semibold text-white mb-2">Staff Management</h3>
                      <p className="text-gray-300 text-sm">Manage your team and schedules</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/register"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                  >
                    Start Free Trial
                  </a>
                  <a
                    href="/login"
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 border border-white/20 hover:border-white/30"
                  >
                    Sign In
                  </a>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 mt-16">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Fast Setup</h3>
                    <p className="text-gray-300">Get started in minutes with our intuitive interface</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Secure</h3>
                    <p className="text-gray-300">Your data is protected with enterprise-grade security</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
                      <span className="text-2xl">📱</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Mobile Ready</h3>
                    <p className="text-gray-300">Access your restaurant data anywhere, anytime</p>
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
