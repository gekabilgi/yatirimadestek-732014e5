import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { shouldShowMenuItem } from '@/utils/menuVisibility';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MainNavbarProps {
  className?: string;
}

// Cache configuration
const MENU_CACHE_KEY = 'mainNavbar_menuItems';
const MENU_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Default menu items to show initially (all public items)
const DEFAULT_MENU_ITEMS = [
  { name: 'Destek Arama', href: '/searchsupport' },
  { name: 'Teşvik Araçları', href: '/incentive-tools' },
  { name: 'Yatırım Fırsatları', href: '/investmentopportunities' },
  { name: 'Mevzuat', href: '/legislation' },
  { name: 'Yatırımcı Sözlüğü', href: '/investorglossary' },
  { name: 'Soru & Cevap', href: '/qna' },
  { name: 'Duyurular', href: '/#announcements' },
  { name: 'Soru Sor', href: '/qna#ask' },
];

// Helper function to get initial menu items from cache or defaults
const getInitialMenuItems = () => {
  try {
    const cached = localStorage.getItem(MENU_CACHE_KEY);
    if (cached) {
      const { items, timestamp } = JSON.parse(cached);
      // Use cache if less than 5 minutes old
      if (Date.now() - timestamp < MENU_CACHE_EXPIRY && Array.isArray(items) && items.length > 0) {
        return items;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Fallback: Start with all default items visible (items may hide, but won't suddenly appear)
  return DEFAULT_MENU_ITEMS;
};

const MainNavbar = ({ className }: MainNavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  // Initialize with cached or default items to prevent flickering
  const [visibleNavItems, setVisibleNavItems] = useState(getInitialMenuItems);

  // Fetch menu visibility settings and filter based on user authentication/role
  useEffect(() => {
    const loadMenuSettings = async () => {
      try {
        const { menuVisibilityService } = await import('@/services/menuVisibilityService');
        const { MENU_ITEMS } = await import('@/types/menuSettings');
        
        // Get effective settings for current domain (domain-specific or global)
        const { settings } = await menuVisibilityService.getEffectiveMenuSettings('frontend');
        
        // Filter menu items based on visibility settings and user state
        const visibleItems = MENU_ITEMS.filter(item => {
          const mode = (settings as any)[item.settingKey];
          return shouldShowMenuItem(mode, !!user, isAdmin);
        }).map(item => ({
          name: item.title,
          href: item.url,
        }));
        
        // Cache the results for future page loads
        try {
          localStorage.setItem(MENU_CACHE_KEY, JSON.stringify({
            items: visibleItems,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Ignore localStorage errors
        }
        
        setVisibleNavItems(visibleItems);
      } catch (error) {
        console.error('Error loading menu settings:', error);
        setVisibleNavItems([{ name: 'Destek Arama', href: '/searchsupport' }]);
      }
    };

    loadMenuSettings();
  }, [user, isAdmin]);

  return (
    <nav 
      id="main-navigation"
      className={cn("nav-modern border-b bg-white/95 backdrop-blur-sm shadow-sm", className)}
      role="navigation"
      aria-label="Ana menü"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <Logo className="text-primary h-12 w-auto min-w-[212px]" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {visibleNavItems.map((item) => (
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>Admin</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Paneli</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profilim</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-primary">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>Hesabım</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profilim</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-primary">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/login')}
                className="h-9 px-3 gap-2 text-sm"
              >
                <User className="h-4 w-4" />
                <span>Giriş Yap</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-primary"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-2 border-t pt-4">
            {visibleNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg relative group"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
                <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full"></span>
              </Link>
            ))}
            <div className="pt-2 border-t mt-2">
              {user && isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="inline-block mr-2 h-4 w-4" />
                    Admin Paneli
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="inline-block mr-2 h-4 w-4" />
                    Profilim
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50 rounded-lg"
                  >
                    <LogOut className="inline-block mr-2 h-4 w-4" />
                    Çıkış Yap
                  </button>
                </>
              ) : user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="inline-block mr-2 h-4 w-4" />
                    Profilim
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50 rounded-lg"
                  >
                    <LogOut className="inline-block mr-2 h-4 w-4" />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <Link
                  to="/admin/login"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="inline-block mr-2 h-4 w-4" />
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainNavbar;
