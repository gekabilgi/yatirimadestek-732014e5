import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { menuVisibilityService } from '@/services/menuVisibilityService';
import { shouldShowMenuItem } from '@/utils/menuVisibility';
import { MENU_ITEMS } from '@/types/menuSettings';
import { useToast } from '@/hooks/use-toast';

interface ProtectedMenuRouteProps {
  children: React.ReactNode;
  settingKey: keyof typeof MENU_ITEMS extends number ? never : string;
}

const ProtectedMenuRoute: React.FC<ProtectedMenuRouteProps> = ({ children, settingKey }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      try {
        const settings = await menuVisibilityService.getMenuVisibilitySettings();
        const visibility = settings[settingKey as keyof typeof settings];
        
        if (!visibility) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const isAuthenticated = !!user;
        const canAccess = shouldShowMenuItem(visibility, isAuthenticated, isAdmin);
        
        setHasAccess(canAccess);
        
        if (!canAccess) {
          toast({
            title: "Erişim Reddedildi",
            description: "Bu sayfayı ziyaret etme yetkiniz yok.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking menu access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [authLoading, user, isAdmin, settingKey, location, toast]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedMenuRoute;
