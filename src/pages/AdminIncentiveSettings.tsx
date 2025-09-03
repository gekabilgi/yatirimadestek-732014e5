import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import { adminSettingsService } from '@/services/adminSettingsService';
import { IncentiveCalculationSettings } from '@/types/adminSettings';

const AdminIncentiveSettings = () => {
  const [settings, setSettings] = useState<IncentiveCalculationSettings>({
    sgk_employer_premium_rate_manufacturing: 4355.92,
    sgk_employer_premium_rate_other: 4095.87,
    sgk_employee_premium_rate_manufacturing: 3640.77,
    sgk_employee_premium_rate_other: 3420.64,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await adminSettingsService.getIncentiveCalculationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Hata",
        description: "Ayarlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await adminSettingsService.updateIncentiveCalculationSettings(settings);
      toast({
        title: "Başarılı",
        description: "Teşvik hesaplama ayarları güncellendi.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: keyof IncentiveCalculationSettings, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setSettings(prev => ({
      ...prev,
      [key]: numericValue,
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminPageHeader
          title="Teşvik Hesaplama Ayarları"
          description="SGK prim oranları ve diğer hesaplama parametrelerini yönetin"
          icon={Settings}
        />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Teşvik Hesaplama Ayarları"
        description="SGK prim oranları ve diğer hesaplama parametrelerini yönetin"
        icon={Settings}
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SGK Prim Oranları</CardTitle>
            <CardDescription>
              Teşvik hesaplamalarında kullanılan SGK işveren ve çalışan prim oranlarını düzenleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium mb-4">SGK İşveren Primi Oranı (TL)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sgk_employer_premium_rate_manufacturing">İmalat</Label>
                    <Input
                      id="sgk_employer_premium_rate_manufacturing"
                      type="number"
                      step="0.01"
                      value={settings.sgk_employer_premium_rate_manufacturing}
                      onChange={(e) => handleInputChange('sgk_employer_premium_rate_manufacturing', e.target.value)}
                      placeholder="4355.92"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sgk_employer_premium_rate_other">Diğer</Label>
                    <Input
                      id="sgk_employer_premium_rate_other"
                      type="number"
                      step="0.01"
                      value={settings.sgk_employer_premium_rate_other}
                      onChange={(e) => handleInputChange('sgk_employer_premium_rate_other', e.target.value)}
                      placeholder="4095.87"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium mb-4">SGK Çalışan Primi Oranı (TL)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sgk_employee_premium_rate_manufacturing">İmalat</Label>
                    <Input
                      id="sgk_employee_premium_rate_manufacturing"
                      type="number"
                      step="0.01"
                      value={settings.sgk_employee_premium_rate_manufacturing}
                      onChange={(e) => handleInputChange('sgk_employee_premium_rate_manufacturing', e.target.value)}
                      placeholder="3640.77"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sgk_employee_premium_rate_other">Diğer</Label>
                    <Input
                      id="sgk_employee_premium_rate_other"
                      type="number"
                      step="0.01"
                      value={settings.sgk_employee_premium_rate_other}
                      onChange={(e) => handleInputChange('sgk_employee_premium_rate_other', e.target.value)}
                      placeholder="3420.64"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
          <p className="font-medium mb-2">Bilgi:</p>
          <ul className="space-y-1">
            <li>• Bu değerler teşvik hesaplamalarında kullanılır</li>
            <li>• Değişiklikler tüm yeni hesaplamalarda etkili olur</li>
            <li>• Mevcut hesaplamalar etkilenmez</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminIncentiveSettings;