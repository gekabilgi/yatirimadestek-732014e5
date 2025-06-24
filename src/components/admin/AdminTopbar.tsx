
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Bell, Settings, Search, Menu, X, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

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
    <div className="bg-white border-b shadow-sm h-16 flex items-center justify-between px-4 lg:px-6 sticky">
      {/* Left section - Menu toggle and page title */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="lg:hidden p-2"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {/* Page title */}
        <div className="flex items-center space-x-2">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Right section - Home, Search, notifications, user menu */}
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Home button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleHomeClick}
          className="p-2"
          title="Ana Sayfaya Dön"
        >
          <Home className="h-4 w-4" />
        </Button>

        {/* Search button */}
        <Button variant="ghost" size="sm" className="hidden sm:flex p-2">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm" className="hidden sm:flex p-2">
          <Settings className="h-4 w-4" />
        </Button>

        {/* User avatar and info */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
            <AvatarImage src="" alt="Admin" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          {/* User info - hidden on mobile */}
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-medium text-gray-900">Admin</span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
        </div>

        {/* Logout button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="p-2 text-gray-600 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
