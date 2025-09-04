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
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SGK İşveren Sigorta Primi */}
            <Card className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 py-2 px-4 rounded-lg">
                  SGK İşveren Sigorta Primi(TL)
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 block text-center mb-2">
                    İmalat
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.sgk_employer_premium_rate_manufacturing}
                    onChange={(e) => handleInputChange('sgk_employer_premium_rate_manufacturing', e.target.value)}
                    className="text-center h-12 text-lg"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 block text-center mb-2">
                    Diğer
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.sgk_employer_premium_rate_other}
                    onChange={(e) => handleInputChange('sgk_employer_premium_rate_other', e.target.value)}
                    className="text-center h-12 text-lg"
                  />
                </div>
              </div>
            </Card>

            {/* SGK Çalışan Sigorta Primi */}
            <Card className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 py-2 px-4 rounded-lg">
                  SGK Çalışan Sigorta Primi (TL)
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 block text-center mb-2">
                    İmalat
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.sgk_employee_premium_rate_manufacturing}
                    onChange={(e) => handleInputChange('sgk_employee_premium_rate_manufacturing', e.target.value)}
                    className="text-center h-12 text-lg"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 block text-center mb-2">
                    Diğer
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.sgk_employee_premium_rate_other}
                    onChange={(e) => handleInputChange('sgk_employee_premium_rate_other', e.target.value)}
                    className="text-center h-12 text-lg"
                  />
                </div>
              </div>
            </Card>
          </div>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-8 py-3 h-12 text-lg"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminIncentiveSettings;