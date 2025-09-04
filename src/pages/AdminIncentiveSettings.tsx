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
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SGK Prim Oranları</h1>
            <p className="text-gray-600">Teşvik hesaplamalarında kullanılan SGK işveren ve çalışan prim oranlarını düzenleyin.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SGK İşveren Sigorta Primi */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="bg-gray-50 rounded-xl py-3 px-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">SGK İşveren Sigorta Primi(TL)</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-center mb-2">
                    <span className="text-sm font-medium text-gray-700">İmalat</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.sgk_employer_premium_rate_manufacturing}
                    onChange={(e) => handleInputChange('sgk_employer_premium_rate_manufacturing', e.target.value)}
                    placeholder="4355,92"
                    className="text-center text-lg font-mono h-12 rounded-xl border-gray-200"
                  />
                </div>
                
                <div>
                  <div className="text-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Diğer</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.sgk_employer_premium_rate_other}
                    onChange={(e) => handleInputChange('sgk_employer_premium_rate_other', e.target.value)}
                    placeholder="4095,87"
                    className="text-center text-lg font-mono h-12 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* SGK Çalışan Sigorta Primi */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="bg-gray-50 rounded-xl py-3 px-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">SGK Çalışan Sigorta Primi (TL)</h3>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.sgk_employee_premium_rate_manufacturing}
                    onChange={(e) => handleInputChange('sgk_employee_premium_rate_manufacturing', e.target.value)}
                    placeholder="3640,77"
                    className="text-center text-lg font-mono h-12 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-8">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl text-lg"
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