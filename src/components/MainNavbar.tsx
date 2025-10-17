
import React, { useState, useEffect } from 'react';
import { Menu, X, Calculator, User, LogOut, Settings, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MainNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    await signOut();
  };

  const [visibleNavItems, setVisibleNavItems] = useState([
    { name: 'Destek Arama', href: '/searchsupport' },
  ]);

  // Fetch menu visibility settings for anonymous users
  useEffect(() => {
    const loadMenuSettings = async () => {
      try {
        const { menuVisibilityService } = await import('@/services/menuVisibilityService');
        const { MENU_ITEMS } = await import('@/types/menuSettings');
        const settings = await menuVisibilityService.getMenuVisibilitySettings();
        
        // Filter menu items based on visibility settings
        const visibleItems = MENU_ITEMS.filter(item => settings[item.settingKey]).map(item => ({
          name: item.title,
          href: item.url,
        }));
        
        setVisibleNavItems(visibleItems);
      } catch (error) {
        console.error('Error loading menu settings:', error);
        // Fallback to default if error
        setVisibleNavItems([{ name: 'Destek Arama', href: '/searchsupport' }]);
      }
    };

    if (!isAdmin) {
      loadMenuSettings();
    }
  }, [isAdmin]);

  // Admin sees all items
  const adminNavItems = [
    { name: 'Destek Arama', href: '/searchsupport' },
    { name: '9903 | Teşvik Araçları', href: '/incentive-tools' },
    { name: 'Soru & Cevap', href: '/qna' },
    { name: 'Tedarik Zinciri', href: '/tzy' },
    { name: 'Yatırım Fırsatları', href: '/yatirim-firsatlari' },
    { name: 'Yatırımcı Sözlüğü', href: '/investor-glossary' },
    { name: 'Başvuru Süreci', href: '/basvuru-sureci' },
  ];

  // Combine nav items based on user role
  const navItems = isAdmin ? adminNavItems : visibleNavItems;

  return (
    <nav className="nav-modern border-b bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Yatırıma Destek
                </span>
                <div className="text-xs text-muted-foreground font-medium">
                  Teşvik Sistemi
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="relative px-2 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-primary transition-all duration-200 rounded-lg hover:bg-primary/5 whitespace-nowrap group"
              >
                {item.name}
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full"></span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            {user && isAdmin ? (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 gap-2 text-sm">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="hidden xl:inline text-sm font-medium">Admin</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/admin/login">
                <Button variant="outline" className="h-9 px-3 gap-2 text-sm">
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Admin Girişi</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={toggleMenu} className="p-2 hover:bg-primary/5">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden animate-slide-up">
            <div className="px-4 pt-4 pb-6 space-y-2 border-t bg-white/95 backdrop-blur-sm">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-primary block px-4 py-3 text-base font-medium rounded-lg hover:bg-primary/5 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-border mt-4 space-y-2">
                {user && isAdmin ? (
                  <div className="space-y-3">
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start h-12 text-base gap-3">
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
                      className="w-full justify-start h-12 text-base gap-3 text-red-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Çıkış Yap
                    </Button>
                  </div>
                ) : (
                  <Link to="/admin/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start h-12 text-base gap-3">
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
