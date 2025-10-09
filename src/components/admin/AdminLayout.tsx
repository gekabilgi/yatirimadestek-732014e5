
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
  ChevronRight,
  Scale,
  Bot,
  Megaphone
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
    { name: 'AI Chatbot Bilgi Bankası', href: '/admin/knowledge-base', icon: Bot },
    { name: 'Fizibilite Raporları', href: '/admin/feasibility-reports', icon: FileText },
    { name: 'Fizibilite İstatistikleri', href: '/admin/feasibility-statistics', icon: TrendingUp },
    { name: 'Destek Programları', href: '/admin/support-programs', icon: Target },
    { name: 'Duyuru Yönetimi', href: '/admin/announcements', icon: Megaphone },
    { name: 'Mevzuat Yönetimi', href: '/admin/legislation', icon: Scale },
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
    {
      name: 'Ayarlar',
      href: '/admin/settings',
      icon: Settings,
      subItems: [
        { name: 'Teşvik Hesaplama Ayarları', href: '/admin/settings/incentive-calculation' },
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
    <div className="dashboard-container min-h-screen bg-gray-50">
      <AdminTopbar 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        onLogout={handleLogout}
      />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <div className={cn(
          "md:flex md:w-72 md:flex-col",
          isMobileMenuOpen ? "block" : "hidden"
        )}>
          <div className="flex flex-col flex-grow pt-6 bg-white border-r border-border overflow-y-auto shadow-sm min-h-screen">
            <div className="flex items-center flex-shrink-0 px-6 pb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Settings className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              </div>
            </div>
            <div className="flex-grow flex flex-col">
              <nav className="flex-1 px-4 pb-6 space-y-2">
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
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-gray-700 hover:bg-primary/5 hover:text-primary',
                            'group flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200'
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon
                              className={cn(
                                isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary',
                                'mr-3 flex-shrink-0 h-5 w-5'
                              )}
                            />
                            {item.name}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-8 mt-2 space-y-1 animate-slide-up">
                            {item.subItems.map((subItem) => {
                              const isSubActive = location.pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  className={cn(
                                    isSubActive
                                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent',
                                    'block px-3 py-2 text-sm rounded-r-md transition-all duration-200'
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
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-700 hover:bg-primary/5 hover:text-primary',
                          'group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary',
                            'mr-3 flex-shrink-0 h-5 w-5'
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
          <main className="flex-1 p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
            {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export { AdminLayout };
