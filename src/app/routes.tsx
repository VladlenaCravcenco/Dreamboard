import ResetPasswordScreen from './screens/ResetPasswordScreen';
import { features } from './config/features';
import { createBrowserRouter, Navigate } from 'react-router';
import RootLayout from './components/RootLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import MainScreen from './screens/MainScreen';
import DetailScreen from './screens/DetailScreen';
import CompletedScreen from './screens/CompletedScreen';
import StatsScreen from './screens/StatsScreen';
import CardScreen from './screens/CardScreen';
import RemindersScreen from './screens/RemindersScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      // Public: only auth page
      {
        path: '/auth',
        Component: AuthScreen,
      },
      { path: '/reset-password', Component: ResetPasswordScreen },
      // Protected: everything else requires a session
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: Layout,
            children: [
              { index: true, Component: MainScreen },
              { path: '/dream/:id', Component: DetailScreen },
              { path: '/completed', Component: CompletedScreen },
              { path: '/stats', Component: StatsScreen },
              { path: '/card', element: features.dreamcard ? <CardScreen /> : <Navigate to="/" replace /> },
              { path: '/reminders', element: features.reminders ? <RemindersScreen /> : <Navigate to="/" replace /> },
              { path: '/profile', Component: ProfileScreen },
            ],
          },
        ],
      },
    ],
  },
]);
