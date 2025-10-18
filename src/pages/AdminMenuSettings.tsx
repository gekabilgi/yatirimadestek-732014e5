import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';
import { menuVisibilityService } from '@/services/menuVisibilityService';
import { MenuVisibilitySettings, MenuVisibilityMode, MENU_ITEMS, VISIBILITY_MODE_LABELS } from '@/types/menuSettings';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminMenuSettings = () => {
  const [settings, setSettings] = useState<MenuVisibilitySettings>({
    menu_item_destek_arama: 'public',
    menu_item_tesvik_araclari: 'anonymous_only',
    menu_item_soru_cevap: 'anonymous_only',
    menu_item_tedarik_zinciri: 'anonymous_only',
    menu_item_yatirim_firsatlari: 'anonymous_only',
    menu_item_yatirimci_sozlugu: 'anonymous_only',
    menu_item_basvuru_sureci: 'anonymous_only',
  });
  
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

  const handleVisibilityChange = async (menuItemKey: keyof MenuVisibilitySettings, newMode: MenuVisibilityMode) => {
    const previousMode = settings[menuItemKey];
    // Optimistically update UI
    setSettings(prev => ({ ...prev, [menuItemKey]: newMode }));
    
    setSavingStates(prev => ({ ...prev, [menuItemKey]: true }));
    try {
      await menuVisibilityService.updateMenuItemVisibility(menuItemKey, newMode);
      toast({
        title: "Başarılı",
        description: `Menü öğesi görünürlüğü güncellendi.`,
      });
    } catch (error) {
      console.error('Error saving menu visibility:', error);
      // Revert UI on failure
      setSettings(prev => ({ ...prev, [menuItemKey]: previousMode }));
      toast({
        title: "Hata",
        description: "Ayar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [menuItemKey]: false }));
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminPageHeader
          title="Menü Görünürlük Ayarları"
          description="Ana menüde hangi öğelerin herkese görünür olacağını belirleyin"
          icon={Menu}
        />
        <div className="p-4 sm:p-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-11" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Menü Görünürlük Ayarları"
        description="Ana menüde hangi öğelerin herkese görünür olacağını belirleyin"
        icon={Menu}
      />
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Menü Öğeleri Görünürlüğü</CardTitle>
            <CardDescription>
              Her menü öğesi için görünürlük modunu seçin: Sadece anonim kullanıcılar, sadece yöneticiler, 
              tüm giriş yapmış kullanıcılar veya herkese açık olabilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {MENU_ITEMS.map((item, index) => (
              <React.Fragment key={item.settingKey}>
                <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5 flex-1 pr-4">
                    <Label 
                      htmlFor={item.settingKey}
                      className="text-base font-medium"
                    >
                      {item.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Select
                    value={settings[item.settingKey]}
                    onValueChange={(value) => handleVisibilityChange(item.settingKey, value as MenuVisibilityMode)}
                    disabled={savingStates[item.settingKey]}
                  >
                    <SelectTrigger className="w-[280px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {(Object.keys(VISIBILITY_MODE_LABELS) as MenuVisibilityMode[]).map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {VISIBILITY_MODE_LABELS[mode]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {index < MENU_ITEMS.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMenuSettings;
