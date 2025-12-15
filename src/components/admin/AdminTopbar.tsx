
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Bell, Settings, Menu, X, Home, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationDropdown } from './NotificationDropdown';
import { AdminThemeSelector } from './AdminThemeSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    if (path === '/admin/announcements') return 'Duyuru Yönetimi';
    if (path === '/admin/incentive-settings') return 'Teşvik Hesaplayıcı Ayarları';
    if (path === '/admin/knowledge-base') return 'Chatbot Bilgi Bankası';
    if (path === '/admin/legislation') return 'Mevzuat Yönetimi';
    if (path === '/admin/user-management') return 'Kullanıcı ve Rol Yönetimi';
    if (path === '/admin/settings/menu-visibility') return 'Menü Görünürlük Ayarları';
    if (path === '/profile') return 'Profilim';
    if (path === '/admin/tzy-products') return 'TZY Ürün Listesi';
    if (path === '/admin/tzy-product-add') return 'TZY Ürün Ekle';
    if (path === '/admin/tzy-pre-requests') return 'TZY Ön Talepler';
    if (path === '/admin/tzy-supplier-applications') return 'TZY Tedarikçi Başvuruları';
    if (path === '/admin/tzy-email-logs') return 'TZY E-posta Logları';
    if (path.startsWith('/admin/tzy-company-edit')) return 'TZY Firma Düzenle';
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
    <div className="dashboard-header h-16 flex items-center justify-between px-4 lg:px-6 fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
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
          <h1 className="text-lg lg:text-xl font-bold text-foreground">{getPageTitle()}</h1>
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


        {/* Notifications */}
        <NotificationDropdown />

        {/* Theme Selector */}
        <AdminThemeSelector />

        {/* User avatar dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              {/* User info - hidden on mobile and small tablets */}
              <div className="hidden lg:flex flex-col">
                <span className="text-sm font-semibold text-foreground">Admin</span>
                <span className="text-xs text-muted-foreground truncate max-w-32">{user?.email}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56 bg-background z-50">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profilim</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/admin/settings/menu-visibility')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Ayarlar</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
