import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { publicRoutes } from './publicRoutes';
import { appRoutes } from './appRoutes';
import { adminRoutes } from './adminRoutes';
import { NotFoundState } from '../components/common/NotFoundState';
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';

const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      publicRoutes,
      appRoutes,
      adminRoutes,
      {
        path: '*',
        element: <NotFoundState />,
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
