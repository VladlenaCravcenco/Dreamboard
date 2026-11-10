import { Outlet, useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthProvider } from '../context/AuthContext';
import { DreamProvider } from '../context/DreamContext';
import { Toaster } from './ui/sonner';
import RouteTitle from './RouteTitle';

function ResumeInvite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    const path = sessionStorage.getItem('dreamboard-pending-invite');
    if (!user || !path) return;
    if (!/^\/invite\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path) && !/^\/u\/[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(path)) { sessionStorage.removeItem('dreamboard-pending-invite'); return; }
    if (pathname === '/' || pathname === '/auth') navigate(path, { replace: true });
    if (pathname === path) sessionStorage.removeItem('dreamboard-pending-invite');
  }, [user, pathname, navigate]);
  return null;
}
export default function RootLayout() {
  return (
    <AuthProvider>
      <DreamProvider>
        <ResumeInvite />
        <RouteTitle />
        <Outlet />
        <Toaster position="top-right" />
      </DreamProvider>
    </AuthProvider>
  );
}