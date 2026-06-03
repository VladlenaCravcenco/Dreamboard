import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { DreamProvider } from '../context/DreamContext';
import { Toaster } from './ui/sonner';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DreamProvider>
        <Outlet />
        <Toaster position="top-right" />
      </DreamProvider>
    </AuthProvider>
  );
}