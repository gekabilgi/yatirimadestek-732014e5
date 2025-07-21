
import React, { useState } from 'react';
import { Menu, X, Calculator, User, LogOut, Settings, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const MainNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    await signOut();
  };

  // Base navigation items available to everyone
  const baseNavItems = [
    { name: '9903 | Teşvik Araçları', href: '/incentive-tools' },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { name: 'Tedarik Zinciri', href: '/tzy' },
    { name: 'Soru & Cevap', href: '/qna' },
    { name: 'Destek Arama', href: '/searchsupport' },
    { name: 'Yatırım Fırsatları', href: '/yatirim-firsatlari' },
    { name: 'Yatırımcı Sözlüğü', href: '/investor-glossary' },
  ];

  // Combine nav items based on user role
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Yatırım Destek</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-primary px-2 lg:px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {user && isAdmin ? (
              <div className="flex items-center space-x-2">
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="h-9 px-3 text-sm">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Admin Panel</span>
                    <span className="lg:hidden">Admin</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="h-9 px-3 text-sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Çıkış Yap</span>
                  <span className="lg:hidden">Çıkış</span>
                </Button>
              </div>
            ) : (
              <Link to="/admin/login">
                <Button variant="outline" size="sm" className="h-9 px-3 text-sm">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Admin Girişi</span>
                  <span className="lg:hidden">Giriş</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={toggleMenu} className="p-2">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t bg-white">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-primary block px-3 py-3 text-base font-medium rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 mt-4">
                {user && isAdmin ? (
                  <div className="space-y-2">
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start h-11 text-base">
                        <Settings className="h-5 w-5 mr-3" />
                        Admin Panel
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }} 
                      className="w-full justify-start h-11 text-base"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Çıkış Yap
                    </Button>
                  </div>
                ) : (
                  <Link to="/admin/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start h-11 text-base">
                      <User className="h-5 w-5 mr-3" />
                      Admin Girişi
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainNavbar;
