import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Guards all authenticated routes.
 * 
 * Flow:
 *  loading = true  → show spinner (auth state not yet resolved from localStorage)
 *  loading = false, user = null → redirect to /auth
 *  loading = false, user exists → render the app
 * 
 * IMPORTANT: we never redirect while loading is true, because:
 *  - signIn sets user synchronously before navigate() is called
 *  - But getSession() is async — if we redirect during that window we'd bounce the user
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p
          className="text-muted-foreground text-sm"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Loading Dreamboard…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
