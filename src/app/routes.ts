import { createBrowserRouter } from 'react-router';
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
              { path: '/card', Component: CardScreen },
              { path: '/reminders', Component: RemindersScreen },
              { path: '/profile', Component: ProfileScreen },
            ],
          },
        ],
      },
    ],
  },
]);
