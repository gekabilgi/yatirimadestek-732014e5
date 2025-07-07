
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  console.log('ProtectedAdminRoute check:', { user: !!user, isAdmin, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    console.log('Access denied - redirecting to admin login');
    return <Navigate to="/admin/login" replace />;
  }

  console.log('Access granted - rendering protected content');
  return <>{children}</>;
};

export default ProtectedAdminRoute;
