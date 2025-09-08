import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

export default function Login() {
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const client = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISH_KEY
      );
      setSupabaseClient(client);
    }
  }, []);

  if (!supabaseClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <a
              href="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              create a new account
            </a>
          </p>
        </div>
        <div className="mt-8">
          <Auth
            supabaseClient={supabaseClient}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1',
                    brandAccent: '#4f46e5',
                  }
                }
              }
            }}
            providers={['google', 'github']}
            socialLayout="horizontal"
            theme="dark"
            view="sign_in"
          />
        </div>
      </div>
    </div>
  );
}