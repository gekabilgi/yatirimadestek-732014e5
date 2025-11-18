
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Bell, Settings, Search, Menu, X, Home, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationDropdown } from './NotificationDropdown';

interface AdminTopbarProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  onLogout: () => void;
}

export const AdminTopbar = ({ isMobileMenuOpen, toggleMobileMenu, onLogout }: AdminTopbarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path === '/admin/support-programs') return 'Destek Programları';
    if (path === '/admin/qa-management') return 'Q&A Yönetimi';
    if (path === '/admin/analytics') return 'Analytics';
    if (path === '/admin/email-management') return 'E-posta Yönetimi';
    if (path === '/admin/glossary-management') return 'Sözlük Yönetimi';
    if (path === '/admin/feasibility-reports') return 'Fizibilite Raporları';
    return 'Admin Panel';
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="dashboard-header h-16 flex items-center justify-between px-4 lg:px-6 fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      {/* Left section - Menu toggle and page title */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 hover:bg-primary/5"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {/* Page title */}
        <div className="flex items-center space-x-2">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Right section - Home, Search, notifications, user menu */}
      <div className="flex items-center space-x-3">
        {/* Home button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleHomeClick}
          className="p-2 hover:bg-primary/5"
          title="Ana Sayfaya Dön"
        >
          <Home className="h-4 w-4" />
        </Button>

        {/* Search button - hidden on small screens */}
        <Button variant="ghost" size="sm" className="hidden md:flex p-2 hover:bg-primary/5">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Settings - hidden on small screens */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/admin/settings/menu-visibility')}
          className="hidden md:flex p-2 hover:bg-primary/5"
          title="Ayarlar"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* User avatar and info */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9 ring-2 ring-primary/10">
            <AvatarImage src="" alt="Admin" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          {/* User info - hidden on mobile and small tablets */}
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-semibold text-gray-900">Admin</span>
            <span className="text-xs text-gray-500 truncate max-w-32">{user?.email}</span>
          </div>
        </div>

        {/* Logout button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
