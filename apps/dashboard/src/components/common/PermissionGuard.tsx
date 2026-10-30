import React from 'react';
import { useLocation } from 'react-router-dom';
import { useRbac } from '../../context/RbacContext';
import { AccessDeniedPage } from '../../pages/common/AccessDeniedPage';
import type { PermissionCategory, PermissionType } from '../../services/rbacService';

interface PermissionGuardProps {
  category?: PermissionCategory;
  action?: PermissionType;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  category,
  action = 'View',
  children,
}) => {
  const location = useLocation();
  const { hasPermission, canAccessPath } = useRbac();

  let isAllowed = true;
  if (category) {
    isAllowed = hasPermission(category, action);
  } else {
    isAllowed = canAccessPath(location.pathname);
  }

  if (!isAllowed) {
    return (
      <AccessDeniedPage
        attemptedPath={location.pathname}
        requiredPermission={category ? `${category}:${action}` : undefined}
      />
    );
  }

  return <>{children}</>;
};
