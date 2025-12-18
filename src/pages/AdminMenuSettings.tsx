import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Menu, Globe, Settings, X, Plus, Loader2, Trash2, Copy, Check, Palette } from "lucide-react";
import { menuVisibilityService } from "@/services/menuVisibilityService";
import { adminSettingsService, LogoColorMode } from "@/services/adminSettingsService";
import { Logo } from "@/components/Logo";
import {
  MenuVisibilitySettings,
  MenuItemVisibility,
  MENU_ITEMS,
  AdminMenuVisibilitySettings,
  ADMIN_MENU_ITEMS,
  DEFAULT_VISIBILITY,
  DEFAULT_ADMIN_VISIBILITY,
} from "@/types/menuSettings";

const AdminMenuSettings = () => {
  // Domain management state
  const [configuredDomains, setConfiguredDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("global");
  const [newDomainName, setNewDomainName] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [isDeletingDomain, setIsDeletingDomain] = useState(false);

  // Settings state
  const [frontendSettings, setFrontendSettings] = useState<MenuVisibilitySettings | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminMenuVisibilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [logoMode, setLogoMode] = useState<LogoColorMode>('all_themed');
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  
  const { toast } = useToast();
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  // Load configured domains
  useEffect(() => {
    const loadDomains = async () => {
      const domains = await menuVisibilityService.getAllConfiguredDomains();
      setConfiguredDomains(domains);
    };
    loadDomains();
    
    // Load logo mode
    adminSettingsService.getLogoColorMode().then(setLogoMode);
  }, []);

  // Load settings when selected domain changes
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        if (selectedDomain === "global") {
          const [frontendData, adminData] = await Promise.all([
            menuVisibilityService.getMenuVisibilitySettings(),
            menuVisibilityService.getAdminMenuVisibilitySettings(),
          ]);
          setFrontendSettings(frontendData);
          setAdminSettings(adminData);
        } else {
          // Load domain-specific settings
          const [frontendData, adminData] = await Promise.all([
            menuVisibilityService.getDomainMenuSettings(selectedDomain, 'frontend'),
            menuVisibilityService.getDomainMenuSettings(selectedDomain, 'admin'),
          ]);

          // If no settings exist for this domain, use defaults with all items visible
          setFrontendSettings((frontendData as MenuVisibilitySettings) || getFullVisibilityFrontend());
          setAdminSettings((adminData as AdminMenuVisibilitySettings) || getFullVisibilityAdmin());
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: "Hata",
          description: "Ayarlar yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [selectedDomain, toast]);

  // Helper: Full visibility for new domains (all menus visible)
  const getFullVisibilityFrontend = (): MenuVisibilitySettings => ({
    menu_item_destek_arama: { admin: true, registered: true, anonymous: true },
    menu_item_tesvik_araclari: { admin: true, registered: true, anonymous: true },
    menu_item_soru_cevap: { admin: true, registered: true, anonymous: true },
    menu_item_tedarik_zinciri: { admin: true, registered: true, anonymous: true },
    menu_item_yatirim_firsatlari: { admin: true, registered: true, anonymous: true },
    menu_item_yatirimci_sozlugu: { admin: true, registered: true, anonymous: true },
    menu_item_basvuru_sureci: { admin: true, registered: true, anonymous: true },
    menu_item_chat: { admin: true, registered: true, anonymous: true },
  });

  const getFullVisibilityAdmin = (): AdminMenuVisibilitySettings => ({
    admin_menu_dashboard: { admin: true, registered: true, anonymous: false },
    admin_menu_qa_management: { admin: true, registered: true, anonymous: false },
    admin_menu_knowledge_base: { admin: true, registered: true, anonymous: false },
    admin_menu_form_builder: { admin: true, registered: true, anonymous: false },
    admin_menu_feasibility_reports: { admin: true, registered: true, anonymous: false },
    admin_menu_support_programs: { admin: true, registered: true, anonymous: false },
    admin_menu_announcements: { admin: true, registered: true, anonymous: false },
    admin_menu_legislation: { admin: true, registered: true, anonymous: false },
    admin_menu_glossary: { admin: true, registered: true, anonymous: false },
    admin_menu_profile: { admin: true, registered: true, anonymous: false },
    admin_menu_user_management: { admin: true, registered: true, anonymous: false },
    admin_menu_email_management: { admin: true, registered: true, anonymous: false },
    admin_menu_supply_chain: { admin: true, registered: true, anonymous: false },
    admin_menu_analytics: { admin: true, registered: true, anonymous: false },
  });

  // Add new domain
  const handleAddDomain = async () => {
    const domain = newDomainName.trim().toLowerCase();
    if (!domain) return;

    if (configuredDomains.includes(domain)) {
      toast({
        title: "Uyarı",
        description: "Bu domain zaten yapılandırılmış.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingDomain(true);
    try {
      // Create domain with default full visibility
      await menuVisibilityService.saveDomainMenuSettings(domain, 'frontend', getFullVisibilityFrontend());
      await menuVisibilityService.saveDomainMenuSettings(domain, 'admin', getFullVisibilityAdmin());

      setConfiguredDomains(prev => [...prev, domain].sort());
      setSelectedDomain(domain);
      setNewDomainName("");
      toast({
        title: "Başarılı",
        description: `${domain} için ayarlar oluşturuldu.`,
      });
    } catch (error) {
      console.error("Error adding domain:", error);
      toast({
        title: "Hata",
        description: "Domain eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  // Delete domain settings
  const handleDeleteDomain = async (domain: string) => {
    setIsDeletingDomain(true);
    try {
      await menuVisibilityService.deleteDomainSettings(domain);
      setConfiguredDomains(prev => prev.filter(d => d !== domain));
      if (selectedDomain === domain) {
        setSelectedDomain("global");
      }
      toast({
        title: "Başarılı",
        description: `${domain} ayarları silindi.`,
      });
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast({
        title: "Hata",
        description: "Domain silinirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingDomain(false);
    }
  };

  // Copy settings from global to selected domain
  const handleCopyFromGlobal = async () => {
    if (selectedDomain === "global") return;

    try {
      const [globalFrontend, globalAdmin] = await Promise.all([
        menuVisibilityService.getMenuVisibilitySettings(),
        menuVisibilityService.getAdminMenuVisibilitySettings(),
      ]);

      await Promise.all([
        menuVisibilityService.saveDomainMenuSettings(selectedDomain, 'frontend', globalFrontend),
        menuVisibilityService.saveDomainMenuSettings(selectedDomain, 'admin', globalAdmin),
      ]);

      setFrontendSettings(globalFrontend);
      setAdminSettings(globalAdmin);

      toast({
        title: "Başarılı",
        description: "Global ayarlar kopyalandı.",
      });
    } catch (error) {
      console.error("Error copying settings:", error);
      toast({
        title: "Hata",
        description: "Ayarlar kopyalanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Toggle handler for frontend settings
  const handleFrontendToggleChange = async (
    menuItemKey: keyof MenuVisibilitySettings,
    userType: keyof MenuItemVisibility,
    newValue: boolean,
  ) => {
    if (!frontendSettings) return;

    const previousVisibility = frontendSettings[menuItemKey];
    const newVisibility = { ...previousVisibility, [userType]: newValue };
    const newSettings = { ...frontendSettings, [menuItemKey]: newVisibility };

    setFrontendSettings(newSettings);

    const savingKey = `frontend_${menuItemKey}_${userType}`;
    setSavingStates(prev => ({ ...prev, [savingKey]: true }));

    try {
      if (selectedDomain === "global") {
        await menuVisibilityService.updateMenuItemVisibility(menuItemKey, newVisibility);
      } else {
        await menuVisibilityService.saveDomainMenuSettings(selectedDomain, 'frontend', newSettings);
      }
      toast({
        title: "Başarılı",
        description: "Görünürlük güncellendi.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      setFrontendSettings(prev => (prev ? { ...prev, [menuItemKey]: previousVisibility } : null));
      toast({
        title: "Hata",
        description: "Kaydetme hatası.",
        variant: "destructive",
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [savingKey]: false }));
    }
  };

  // Toggle handler for admin settings
  const handleAdminToggleChange = async (
    menuItemKey: keyof AdminMenuVisibilitySettings,
    userType: keyof MenuItemVisibility,
    newValue: boolean,
  ) => {
    if (!adminSettings) return;

    const previousVisibility = adminSettings[menuItemKey];
    const newVisibility = { ...previousVisibility, [userType]: newValue };
    const newSettings = { ...adminSettings, [menuItemKey]: newVisibility };

    setAdminSettings(newSettings);

    const savingKey = `admin_${menuItemKey}_${userType}`;
    setSavingStates(prev => ({ ...prev, [savingKey]: true }));

    try {
      if (selectedDomain === "global") {
        await menuVisibilityService.updateAdminMenuItemVisibility(menuItemKey, newVisibility);
      } else {
        await menuVisibilityService.saveDomainMenuSettings(selectedDomain, 'admin', newSettings);
      }
      toast({
        title: "Başarılı",
        description: "Görünürlük güncellendi.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      setAdminSettings(prev => (prev ? { ...prev, [menuItemKey]: previousVisibility } : null));
      toast({
        title: "Hata",
        description: "Kaydetme hatası.",
        variant: "destructive",
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [savingKey]: false }));
    }
  };

  const handleLogoModeChange = async (mode: LogoColorMode) => {
    setIsSavingLogo(true);
    try {
      await adminSettingsService.setLogoColorMode(mode);
      setLogoMode(mode);
      toast({ title: "Başarılı", description: "Logo renk modu güncellendi." });
    } catch (error) {
      toast({ title: "Hata", description: "Logo modu kaydedilemedi.", variant: "destructive" });
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Render menu table
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
            <th className="text-left py-3 px-3 font-semibold text-foreground">Menü Öğesi</th>
            <th className="text-center py-3 px-4 font-semibold text-foreground min-w-[100px]">Admin</th>
            <th className="text-center py-3 px-4 font-semibold text-foreground min-w-[100px]">Kayıtlı</th>
            <th className="text-center py-3 px-4 font-semibold text-foreground min-w-[100px]">Anonim</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const settingKey = item.settingKey;
            const visibility = (settings as any)[settingKey];
            const isLastRow = index === items.length - 1;

            return (
              <tr key={settingKey} className={`hover:bg-muted/30 transition-colors ${!isLastRow ? "border-b" : ""}`}>
                <td className="py-2 px-3">
                  <div className="font-medium text-foreground text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </td>
                <td className="py-2 px-4 text-center">
                  <Switch
                    checked={visibility?.admin ?? false}
                    onCheckedChange={(checked) => handleToggle(settingKey, "admin", checked)}
                    disabled={savingStates[`${keyPrefix}_${settingKey}_admin`]}
                  />
                </td>
                <td className="py-2 px-4 text-center">
                  <Switch
                    checked={visibility?.registered ?? false}
                    onCheckedChange={(checked) => handleToggle(settingKey, "registered", checked)}
                    disabled={savingStates[`${keyPrefix}_${settingKey}_registered`]}
                  />
                </td>
                <td className="py-2 px-4 text-center">
                  <Switch
                    checked={visibility?.anonymous ?? false}
                    onCheckedChange={(checked) => handleToggle(settingKey, "anonymous", checked)}
                    disabled={savingStates[`${keyPrefix}_${settingKey}_anonymous`]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminPageHeader
          title="Menü Görünürlük Ayarları"
          description="Domain bazlı menü görünürlüğünü yönetin"
          icon={Menu}
        />
        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
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
        title="Menü Görünürlük Ayarları"
        description="Domain bazlı menü görünürlüğünü yönetin"
        icon={Menu}
      />
      <div className="p-2 sm:p-4 space-y-4">
        {/* Domain Selector Card */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domain Seçimi
            </CardTitle>
            <CardDescription>
              Mevcut domain: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{currentDomain}</code>
              {configuredDomains.includes(currentDomain) && (
                <Badge variant="secondary" className="ml-2 text-xs">Yapılandırılmış</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Domain seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Global Ayarlar (Varsayılan)
                    </div>
                  </SelectItem>
                  {configuredDomains.map(domain => (
                    <SelectItem key={domain} value={domain}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {domain}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Domain Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Yeni Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Domain Ekle</DialogTitle>
                    <DialogDescription>
                      Bu domain için özel menü görünürlük ayarları tanımlayın.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="örn: test.yatirimadestek.gov.tr"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddDomain} disabled={isAddingDomain || !newDomainName.trim()}>
                      {isAddingDomain ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Domain Actions */}
              {selectedDomain !== "global" && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCopyFromGlobal}>
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Global'den Kopyala</span>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Sil</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Domain Ayarlarını Sil?</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong>{selectedDomain}</strong> için tüm özel ayarlar silinecek. 
                          Bu domain global ayarları kullanmaya başlayacak.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteDomain(selectedDomain)} disabled={isDeletingDomain}>
                          {isDeletingDomain ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            {/* Info box */}
            <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              {selectedDomain === "global" ? (
                <p>Global ayarlar, özel yapılandırması olmayan tüm domainlerde geçerlidir.</p>
              ) : (
                <p>
                  <strong>{selectedDomain}</strong> için özel ayarları düzenliyorsunuz. 
                  Bu domain global ayarları yok sayacaktır.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Menu Settings Tabs */}
        {frontendSettings && adminSettings && (
          <Tabs defaultValue="frontend" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="frontend" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Frontend Menü
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Admin Menü
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Logo Ayarları
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frontend">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Frontend Menü Görünürlüğü</CardTitle>
                  <CardDescription className="text-sm">
                    {selectedDomain === "global" 
                      ? "Tüm siteler için varsayılan menü ayarları"
                      : `${selectedDomain} için özel menü ayarları`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderMenuTable(MENU_ITEMS, frontendSettings, handleFrontendToggleChange, "frontend")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Admin Menü Görünürlüğü</CardTitle>
                  <CardDescription className="text-sm">
                    {selectedDomain === "global"
                      ? "Tüm siteler için varsayılan admin menü ayarları"
                      : `${selectedDomain} için özel admin menü ayarları`}
                    <span className="block mt-1 text-xs text-primary">
                      Not: "Ayarlar" menüsü kilitlenme önlemi için her zaman görünürdür.
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderMenuTable(ADMIN_MENU_ITEMS, adminSettings, handleAdminToggleChange, "admin")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logo">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Logo Renk Ayarları</CardTitle>
                  <CardDescription className="text-sm">
                    Logo renklerinin tema ile uyumunu ayarlayın. Yeşil # işareti her zaman sabit kalır.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center p-6 bg-primary rounded-lg">
                    <Logo className="text-primary-foreground" width={200} />
                  </div>
                  
                  <RadioGroup value={logoMode} onValueChange={(v) => handleLogoModeChange(v as LogoColorMode)} disabled={isSavingLogo}>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="all_themed" id="all_themed" />
                        <Label htmlFor="all_themed" className="flex-1 cursor-pointer">
                          <span className="font-medium">Hepsi Tema Uyumlu</span>
                          <span className="block text-sm text-muted-foreground">Grafik ve yazılar tema rengini kullanır</span>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="graphic_themed" id="graphic_themed" />
                        <Label htmlFor="graphic_themed" className="flex-1 cursor-pointer">
                          <span className="font-medium">Sadece Grafik Tema</span>
                          <span className="block text-sm text-muted-foreground">Grafik tema rengi, yazılar sabit lacivert</span>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="text_themed" id="text_themed" />
                        <Label htmlFor="text_themed" className="flex-1 cursor-pointer">
                          <span className="font-medium">Sadece Yazılar Tema</span>
                          <span className="block text-sm text-muted-foreground">Grafik sabit kırmızı, yazılar tema rengi</span>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="original" id="original" />
                        <Label htmlFor="original" className="flex-1 cursor-pointer">
                          <span className="font-medium">Orijinal Renkler</span>
                          <span className="block text-sm text-muted-foreground">Tüm renkler sabit (kırmızı, lacivert, yeşil)</span>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="all_white" id="all_white" />
                        <Label htmlFor="all_white" className="flex-1 cursor-pointer">
                          <span className="font-medium">Tamamı Beyaz</span>
                          <span className="block text-sm text-muted-foreground">Logo beyaz, yeşil # sabit kalır</span>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMenuSettings;
