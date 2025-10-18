import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';
import { menuVisibilityService } from '@/services/menuVisibilityService';
import { MenuVisibilitySettings, MenuItemVisibility, MENU_ITEMS } from '@/types/menuSettings';

const AdminMenuSettings = () => {
  const [settings, setSettings] = useState<MenuVisibilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await menuVisibilityService.getMenuVisibilitySettings();
        setSettings(data);
      } catch (error) {
        console.error('Error loading menu visibility settings:', error);
        toast({
          title: "Hata",
          description: "Menü ayarları yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [toast]);

  const handleToggleChange = async (
    menuItemKey: keyof MenuVisibilitySettings,
    userType: keyof MenuItemVisibility,
    newValue: boolean
  ) => {
    if (!settings) return;

    const previousVisibility = settings[menuItemKey];
    const newVisibility = { ...previousVisibility, [userType]: newValue };
    
    // Optimistically update UI
    setSettings(prev => prev ? ({ ...prev, [menuItemKey]: newVisibility }) : null);
    
    const savingKey = `${menuItemKey}_${userType}`;
    setSavingStates(prev => ({ ...prev, [savingKey]: true }));
    
    try {
      await menuVisibilityService.updateMenuItemVisibility(menuItemKey, newVisibility);
      toast({
        title: "Başarılı",
        description: `Menü öğesi görünürlüğü güncellendi.`,
      });
    } catch (error) {
      console.error('Error saving menu visibility:', error);
      // Revert UI on failure
      setSettings(prev => prev ? ({ ...prev, [menuItemKey]: previousVisibility }) : null);
      toast({
        title: "Hata",
        description: "Ayar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [savingKey]: false }));
    }
  };

  if (isLoading || !settings) {
    return (
      <AdminLayout>
        <AdminPageHeader
          title="Menü Görünürlük Ayarları"
          description="Her menü ögesi için görünürlük modunu seçin"
          icon={Menu}
        />
        <div className="p-4 sm:p-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Menü Öğeleri Görünürlüğü"
        description="Her menü ögesi için görünürlük modunu seçin: Sadece anonim kullanıcılar, sadece yöneticiler, tüm giriş yapmış kullanıcılar veya herkese açık olabilir."
        icon={Menu}
      />
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Menü Öğeleri Görünürlüğü</CardTitle>
            <CardDescription>
              Her menü ögesi için görünürlük modunu seçin: Sadece anonim kullanıcılar, sadece yöneticiler, 
              tüm giriş yapmış kullanıcılar veya herkese açık olabilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Menü Öğesi</th>
                    <th className="text-center py-4 px-6 font-semibold text-foreground min-w-[140px]">Admin</th>
                    <th className="text-center py-4 px-6 font-semibold text-foreground min-w-[180px]">Registered User</th>
                    <th className="text-center py-4 px-6 font-semibold text-foreground min-w-[140px]">Anon User</th>
                  </tr>
                </thead>
                <tbody>
                  {MENU_ITEMS.map((item, index) => {
                    const visibility = settings[item.settingKey];
                    const isLastRow = index === MENU_ITEMS.length - 1;
                    
                    return (
                      <tr 
                        key={item.settingKey}
                        className={`hover:bg-muted/30 transition-colors ${!isLastRow ? 'border-b' : ''}`}
                      >
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={visibility.admin}
                              onCheckedChange={(checked) => 
                                handleToggleChange(item.settingKey, 'admin', checked)
                              }
                              disabled={savingStates[`${item.settingKey}_admin`]}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={visibility.registered}
                              onCheckedChange={(checked) => 
                                handleToggleChange(item.settingKey, 'registered', checked)
                              }
                              disabled={savingStates[`${item.settingKey}_registered`]}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={visibility.anonymous}
                              onCheckedChange={(checked) => 
                                handleToggleChange(item.settingKey, 'anonymous', checked)
                              }
                              disabled={savingStates[`${item.settingKey}_anonymous`]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMenuSettings;
