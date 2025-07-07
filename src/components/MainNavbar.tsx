
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MainNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAdminLogin = () => {
    navigate('/admin-login');
  };

  // Public navigation items (always visible)
  const publicNavigationItems = [
    { name: 'Ana Sayfa', href: '/' },
    { name: 'Teşvik Araçları', href: '/tesvik-araclari' },
  ];

  // Admin-only navigation items
  const adminNavigationItems = [
    { name: 'Destek Ara', href: '/destek-ara' },
    { name: 'Yatırım Fırsatları', href: '/yatirim-firsatlari' },
    { name: 'Fizibilite İstatistikleri', href: '/fizibilite-istatistikleri' },
    { name: 'Tedarik Zinciri', href: '/tedarik-zinciri-yerlilestirme-on-talep-girisi' },
    { name: 'Yatırımcı Sözlüğü', href: '/yatirimci-sozlugu' },
    { name: 'Soru & Cevap', href: '/soru-cevap' }
  ];

  // Combine navigation items based on admin status
  const navigationItems = user && isAdmin 
    ? [...publicNavigationItems, ...adminNavigationItems]
    : publicNavigationItems;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src="/tesviksor.png" alt="Teşviksor" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-gray-900">Teşviksor</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            
            {user && isAdmin ? (
              <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                <Link
                  to="/admin"
                  className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Admin Panel
                </Link>
                <span className="text-sm text-gray-600">
                  <User className="h-4 w-4 inline mr-1" />
                  {user.email}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Çıkış
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                <Button
                  onClick={handleAdminLogin}
                  variant="outline"
                  size="sm"
                >
                  <User className="h-4 w-4 mr-1" />
                  Admin Girişi
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {user && isAdmin ? (
              <div className="pt-4 pb-2 border-t border-gray-200 mt-4">
                <Link
                  to="/admin"
                  className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
                <div className="px-3 py-2 text-sm text-gray-600">
                  <User className="h-4 w-4 inline mr-1" />
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 inline mr-1" />
                  Çıkış
                </button>
              </div>
            ) : (
              <div className="pt-4 pb-2 border-t border-gray-200 mt-4">
                <button
                  onClick={handleAdminLogin}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  <User className="h-4 w-4 inline mr-1" />
                  Admin Girişi
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default MainNavbar;
