import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';
import { menuVisibilityService } from '@/services/menuVisibilityService';
import { MenuVisibilitySettings, MENU_ITEMS } from '@/types/menuSettings';
import { Separator } from '@/components/ui/separator';

const AdminMenuSettings = () => {
  const [settings, setSettings] = useState<MenuVisibilitySettings>({
    menu_item_destek_arama: true,
    menu_item_tesvik_araclari: false,
    menu_item_soru_cevap: false,
    menu_item_tedarik_zinciri: false,
    menu_item_yatirim_firsatlari: false,
    menu_item_yatirimci_sozlugu: false,
    menu_item_basvuru_sureci: false,
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

  const handleToggle = async (menuItemKey: keyof MenuVisibilitySettings, checked: boolean) => {
    // Optimistically update UI
    setSettings(prev => ({ ...prev, [menuItemKey]: checked }));
    
    setSavingStates(prev => ({ ...prev, [menuItemKey]: true }));
    try {
      await menuVisibilityService.updateMenuItemVisibility(menuItemKey, checked);
      toast({
        title: "Başarılı",
        description: `Menü öğesi görünürlüğü ${checked ? 'etkinleştirildi' : 'devre dışı bırakıldı'}.`,
      });
    } catch (error) {
      console.error('Error saving menu visibility:', error);
      // Revert UI on failure
      setSettings(prev => ({ ...prev, [menuItemKey]: !checked }));
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
              Aşağıdaki ayarlar, ana sayfadaki navigasyon menüsünde hangi öğelerin
              giriş yapmamış kullanıcılara (anonim) görüneceğini kontrol eder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {MENU_ITEMS.map((item, index) => (
              <React.Fragment key={item.settingKey}>
                <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5 flex-1 pr-4">
                    <Label 
                      htmlFor={item.settingKey}
                      className="text-base font-medium cursor-pointer"
                    >
                      {item.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    id={item.settingKey}
                    checked={settings[item.settingKey]}
                    onCheckedChange={(checked) => handleToggle(item.settingKey, checked)}
                    disabled={savingStates[item.settingKey]}
                  />
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
