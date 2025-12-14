import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Menu, Globe, Settings } from "lucide-react";
import { menuVisibilityService } from "@/services/menuVisibilityService";
import {
  MenuVisibilitySettings,
  MenuItemVisibility,
  MENU_ITEMS,
  AdminMenuVisibilitySettings,
  ADMIN_MENU_ITEMS,
} from "@/types/menuSettings";

const AdminMenuSettings = () => {
  const [frontendSettings, setFrontendSettings] = useState<MenuVisibilitySettings | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminMenuVisibilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const [frontendData, adminData] = await Promise.all([
          menuVisibilityService.getMenuVisibilitySettings(),
          menuVisibilityService.getAdminMenuVisibilitySettings(),
        ]);
        setFrontendSettings(frontendData);
        setAdminSettings(adminData);
      } catch (error) {
        console.error("Error loading menu visibility settings:", error);
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

  const handleFrontendToggleChange = async (
    menuItemKey: keyof MenuVisibilitySettings,
    userType: keyof MenuItemVisibility,
    newValue: boolean,
  ) => {
    if (!frontendSettings) return;

    const previousVisibility = frontendSettings[menuItemKey];
    const newVisibility = { ...previousVisibility, [userType]: newValue };

    setFrontendSettings((prev) => (prev ? { ...prev, [menuItemKey]: newVisibility } : null));

    const savingKey = `frontend_${menuItemKey}_${userType}`;
    setSavingStates((prev) => ({ ...prev, [savingKey]: true }));

    try {
      await menuVisibilityService.updateMenuItemVisibility(menuItemKey, newVisibility);
      toast({
        title: "Başarılı",
        description: `Menü öğesi görünürlüğü güncellendi.`,
      });
    } catch (error) {
      console.error("Error saving menu visibility:", error);
      setFrontendSettings((prev) => (prev ? { ...prev, [menuItemKey]: previousVisibility } : null));
      toast({
        title: "Hata",
        description: "Ayar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingStates((prev) => ({ ...prev, [savingKey]: false }));
    }
  };

  const handleAdminToggleChange = async (
    menuItemKey: keyof AdminMenuVisibilitySettings,
    userType: keyof MenuItemVisibility,
    newValue: boolean,
  ) => {
    if (!adminSettings) return;

    const previousVisibility = adminSettings[menuItemKey];
    const newVisibility = { ...previousVisibility, [userType]: newValue };

    setAdminSettings((prev) => (prev ? { ...prev, [menuItemKey]: newVisibility } : null));

    const savingKey = `admin_${menuItemKey}_${userType}`;
    setSavingStates((prev) => ({ ...prev, [savingKey]: true }));

    try {
      await menuVisibilityService.updateAdminMenuItemVisibility(menuItemKey, newVisibility);
      toast({
        title: "Başarılı",
        description: `Admin menü öğesi görünürlüğü güncellendi.`,
      });
    } catch (error) {
      console.error("Error saving admin menu visibility:", error);
      setAdminSettings((prev) => (prev ? { ...prev, [menuItemKey]: previousVisibility } : null));
      toast({
        title: "Hata",
        description: "Ayar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingStates((prev) => ({ ...prev, [savingKey]: false }));
    }
  };

  if (isLoading || !frontendSettings || !adminSettings) {
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

  // Filter out Settings from admin menu items - it's always visible and not configurable
  const configurableAdminMenuItems = ADMIN_MENU_ITEMS.filter(
    item => item.settingKey !== 'admin_menu_settings'
  );

  const renderMenuTable = (
    items: typeof MENU_ITEMS | typeof ADMIN_MENU_ITEMS,
    settings: MenuVisibilitySettings | AdminMenuVisibilitySettings,
    handleToggle: (key: any, userType: keyof MenuItemVisibility, value: boolean) => void,
    keyPrefix: string,
  ) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-4 px-4 font-semibold text-foreground">Menü Öğesi</th>
            <th className="text-center py-4 px-6 font-semibold text-foreground min-w-[140px]">Admin</th>
            <th className="text-center py-4 px-6 font-semibold text-foreground min-w-[180px]">Kayıtlı Kullanıcı</th>
            <th className="text-center py-4 px-6 font-semibold text-foreground min-w-[140px]">Anonim</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const settingKey = "settingKey" in item ? item.settingKey : (item as any).settingKey;
            const visibility = (settings as any)[settingKey];
            const isLastRow = index === items.length - 1;

            return (
              <tr key={settingKey} className={`hover:bg-muted/30 transition-colors ${!isLastRow ? "border-b" : ""}`}>
                <td className="py-2 px-2">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </td>
                <td className="py-2 px-4 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={visibility?.admin ?? false}
                      onCheckedChange={(checked) => handleToggle(settingKey, "admin", checked)}
                      disabled={savingStates[`${keyPrefix}_${settingKey}_admin`]}
                    />
                  </div>
                </td>
                <td className="py-2 px-4 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={visibility?.registered ?? false}
                      onCheckedChange={(checked) => handleToggle(settingKey, "registered", checked)}
                      disabled={savingStates[`${keyPrefix}_${settingKey}_registered`]}
                    />
                  </div>
                </td>
                <td className="py-2 px-4 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={visibility?.anonymous ?? false}
                      onCheckedChange={(checked) => handleToggle(settingKey, "anonymous", checked)}
                      disabled={savingStates[`${keyPrefix}_${settingKey}_anonymous`]}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Menü Öğeleri Görünürlüğü"
        description="Frontend ve Admin menü öğelerinin görünürlük ayarlarını yönetin."
        icon={Menu}
      />
      <div className="p-2 sm:p-4">
        <Tabs defaultValue="frontend" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="frontend" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Frontend Menü
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Menü
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frontend">
            <Card>
              <CardHeader>
                <CardTitle>Frontend Menü Görünürlüğü</CardTitle>
                <CardDescription>
                  Ana site menüsündeki öğelerin hangi kullanıcı türlerine görüneceğini ayarlayın.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderMenuTable(MENU_ITEMS, frontendSettings, handleFrontendToggleChange, "frontend")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Menü Görünürlüğü</CardTitle>
                <CardDescription>
                  Admin panelindeki menü öğelerinin hangi kullanıcı türlerine görüneceğini ayarlayın.
                  <span className="block mt-2 text-sm text-primary font-medium">
                    Not: "Ayarlar" menüsü kilitlenme önlemi için her zaman görünürdür.
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderMenuTable(configurableAdminMenuItems, adminSettings, handleAdminToggleChange, "admin")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMenuSettings;
