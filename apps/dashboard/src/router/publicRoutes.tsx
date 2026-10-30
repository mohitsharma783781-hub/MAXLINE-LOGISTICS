import React, { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PublicWebsiteLayout } from '../layouts/PublicWebsiteLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { RoutePlaceholder } from '../components/common/RoutePlaceholder';
import { PageFallback } from '../components/common/PageFallback';

// Lazy-loaded Public & Auth Pages
const LandingPage = lazy(() => import('../pages/public/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const SignupPage = lazy(() => import('../pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const VerificationPage = lazy(() => import('../pages/auth/VerificationPage').then((m) => ({ default: m.VerificationPage })));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const PublicTrackingPage = lazy(() => import('../pages/public/PublicTrackingPage').then((m) => ({ default: m.PublicTrackingPage })));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
);

export const publicRoutes: RouteObject = {
  children: [
    {
      path: '/track',
      element: withSuspense(PublicTrackingPage),
    },
    {
      path: '/track/:awb',
      element: withSuspense(PublicTrackingPage),
    },
    {
      path: '/track/:merchantSlug/:awb',
      element: withSuspense(PublicTrackingPage),
    },
    // Marketing Public Routes (PublicWebsiteLayout)
    {
      element: <PublicWebsiteLayout />,
      children: [
        {
          path: '/',
          element: <LandingPage />,
        },
        {
          path: '/features',
          element: <RoutePlaceholder moduleName="Platform Features Overview" portal="Public" path="/features" />,
        },
        {
          path: '/pricing',
          element: <RoutePlaceholder moduleName="SaaS Pricing Plans" portal="Public" path="/pricing" />,
        },
        {
          path: '/integrations',
          element: <RoutePlaceholder moduleName="Courier & Store Integrations" portal="Public" path="/integrations" />,
        },
        {
          path: '/tracking',
          element: <RoutePlaceholder moduleName="Public Parcel Tracking Portal" portal="Public" path="/tracking" />,
        },
        {
          path: '/about',
          element: <RoutePlaceholder moduleName="About Us & Company Overview" portal="Public" path="/about" />,
        },
        {
          path: '/contact',
          element: <RoutePlaceholder moduleName="Contact Sales & Support" portal="Public" path="/contact" />,
        },
        {
          path: '/faq',
          element: <RoutePlaceholder moduleName="Frequently Asked Questions" portal="Public" path="/faq" />,
        },
      ],
    },
    // Dedicated Super Admin Login Route
    {
      path: '/admin/login',
      element: withSuspense(AdminLoginPage),
    },
    // Authentication Routes (AuthLayout)
    {
      element: <AuthLayout />,
      children: [
        {
          path: '/login',
          element: <LoginPage />,
        },
        {
          path: '/auth/login',
          element: <LoginPage />,
        },
        {
          path: '/signup',
          element: <SignupPage />,
        },
        {
          path: '/register',
          element: <SignupPage />,
        },
        {
          path: '/auth/register',
          element: <SignupPage />,
        },
        {
          path: '/auth/verify',
          element: <VerificationPage />,
        },
        {
          path: '/forgot-password',
          element: <ForgotPasswordPage />,
        },
      ],
    },
  ],
};
