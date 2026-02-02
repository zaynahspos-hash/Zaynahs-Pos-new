import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Role, Permission } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredPermission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, requiredPermission }) => {
  const { isAuthenticated, user } = useStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) return null;

  // Super Admin and Admin (Tenant Owner) bypass all checks
  if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) {
      return <>{children}</>;
  }

  // Role-based access control (RBAC)
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />; 
  }

  // Permission-based access control
  if (requiredPermission && (!user.permissions || !user.permissions.includes(requiredPermission))) {
      // Redirect to a dashboard or show unauthorized
      // For simplicity, redirecting to app root which usually handles default view
      return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};