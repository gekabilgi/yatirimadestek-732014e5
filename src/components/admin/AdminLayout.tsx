
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AdminTopbar } from './AdminTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  MessageSquare, 
  FileText, 
  Mail, 
  Book, 
  BarChart3, 
  Settings,
  Target,
  TrendingUp,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Soru & Cevap', href: '/admin/qa-management', icon: MessageSquare },
    { name: 'Fizibilite Raporları', href: '/admin/feasibility-reports', icon: FileText },
    { name: 'Fizibilite İstatistikleri', href: '/admin/feasibility-statistics', icon: TrendingUp },
    { name: 'Destek Programları', href: '/admin/support-programs', icon: Target },
    { name: 'Yatırımcı Sözlüğü', href: '/admin/glossary-management', icon: Book },
    { name: 'E-posta Yönetimi', href: '/admin/email-management', icon: Mail },
    { 
      name: 'Tedarik Zinciri', 
      href: '/admin/tzyotl', 
      icon: LinkIcon,
      subItems: [
        { name: 'Ön Talep Listesi', href: '/admin/tzyotl' },
        { name: 'Ürün Talep Listesi', href: '/admin/tzyutl' },
        { name: 'Tedarikçi Başvuru Listesi', href: '/admin/tzy-supplier-applications' },
        { name: 'E-posta Logları', href: '/admin/tzy-email-logs' }
      ]
    },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopbar 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        onLogout={handleLogout}
      />
      
      <div className="flex">
        {/* Sidebar */}
        <div className={cn(
          "md:flex md:w-64 md:flex-col",
          isMobileMenuOpen ? "block" : "hidden"
        )}>
          <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => {
                  if (item.subItems) {
                    const isExpanded = expandedMenu === item.name;
                    const hasActiveSubItem = item.subItems.some(subItem => location.pathname === subItem.href);
                    const isActive = hasActiveSubItem || location.pathname === item.href;
                    
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => setExpandedMenu(isExpanded ? null : item.name)}
                          className={cn(
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            'group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md'
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon
                              className={cn(
                                isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500',
                                'mr-3 flex-shrink-0 h-6 w-6'
                              )}
                            />
                            {item.name}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive = location.pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  className={cn(
                                    isSubActive
                                      ? 'bg-primary text-white'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    'block px-2 py-2 text-sm rounded-md'
                                  )}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {subItem.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-6 w-6'
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  }
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export { AdminLayout };
