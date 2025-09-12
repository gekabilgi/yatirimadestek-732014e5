import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
    // Note: The 'other' employee rate is unused in this UI, but kept in state for API consistency.
    sgk_employee_premium_rate_other: 3420.64,
    vat_rate: 20.0,
    customs_duty_rate: 2.0,
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
    // Allow empty string for clearing input, otherwise parse to float
    const numericValue = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0;
    setSettings(prev => ({
      ...prev,
      [key]: numericValue,
    }));
  };
  
  // Helper to format number with comma for display
  const formatValue = (value: number) => {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

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
          <Card>
            <CardHeader>
              <CardTitle>Teşvik Hesaplama Parametreleri</CardTitle>
              <CardDescription>
                SGK prim oranları, KDV ve gümrük vergisi oranlarını düzenleyin. Bu parametreler tüm teşvik hesaplamalarında kullanılır.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                
                {/* SGK İşveren Sigorta Primi */}
                <div className="flex flex-col">
                  <div className="z-10 self-center bg-white px-2">
                    <div className="border rounded-md px-4 py-2">
                       <h5 className="font-semibold text-gray-700 whitespace-nowrap">SGK İşveren Sigorta Primi (TL)</h5>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 -mt-4 pt-8">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <div className="border rounded-md text-center py-1">
                            <Label htmlFor="imalat">İmalat</Label>
                         </div>
                         <div className="border rounded-md">
                           <Input
                             id="imalat"
                             type="text"
                             value={formatValue(settings.sgk_employer_premium_rate_manufacturing)}
                             onChange={(e) => handleInputChange('sgk_employer_premium_rate_manufacturing', e.target.value)}
                             className="w-full text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                           />
                         </div>
                       </div>
                        <div className="space-y-2">
                          <div className="border rounded-md text-center py-1">
                             <Label htmlFor="diger">Diğer</Label>
                          </div>
                          <div className="border rounded-md">
                            <Input
                              id="diger"
                              type="text"
                              value={formatValue(settings.sgk_employer_premium_rate_other)}
                              onChange={(e) => handleInputChange('sgk_employer_premium_rate_other', e.target.value)}
                              className="w-full text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SGK Çalışan Sigorta Primi */}
                  <div className="flex flex-col">
                    <div className="z-10 self-center bg-white px-2">
                      <div className="border rounded-md px-4 py-2">
                         <h5 className="font-semibold text-gray-700 whitespace-nowrap">SGK Çalışan Sigorta Primi (TL)</h5>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 -mt-4 pt-8">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <div className="border rounded-md text-center py-1">
                              <Label htmlFor="calisan_imalat">İmalat</Label>
                           </div>
                           <div className="border rounded-md">
                             <Input
                               id="calisan_imalat"
                               type="text"
                               value={formatValue(settings.sgk_employee_premium_rate_manufacturing)}
                               onChange={(e) => handleInputChange('sgk_employee_premium_rate_manufacturing', e.target.value)}
                               className="w-full text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                             />
                           </div>
                         </div>
                         <div className="space-y-2">
                           <div className="border rounded-md text-center py-1">
                              <Label htmlFor="calisan_diger">Diğer</Label>
                           </div>
                           <div className="border rounded-md">
                             <Input
                               id="calisan_diger"
                               type="text"
                               value={formatValue(settings.sgk_employee_premium_rate_other)}
                               onChange={(e) => handleInputChange('sgk_employee_premium_rate_other', e.target.value)}
                               className="w-full text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                             />
                           </div>
                         </div>
                      </div>
                    </div>
                   </div>

                   {/* VAT and Customs Duty Rates */}
                   <div className="flex flex-col">
                     <div className="z-10 self-center bg-white px-2">
                       <div className="border rounded-md px-4 py-2">
                          <h5 className="font-semibold text-gray-700 whitespace-nowrap">KDV ve Gümrük Vergisi Oranları (%)</h5>
                       </div>
                     </div>
                     <div className="border rounded-lg p-4 -mt-4 pt-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="border rounded-md text-center py-1">
                               <Label htmlFor="vat_rate">KDV Oranı</Label>
                            </div>
                            <div className="border rounded-md">
                              <Input
                                id="vat_rate"
                                type="text"
                                value={formatValue(settings.vat_rate)}
                                onChange={(e) => handleInputChange('vat_rate', e.target.value)}
                                className="w-full text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="border rounded-md text-center py-1">
                               <Label htmlFor="customs_duty_rate">Gümrük Vergisi Oranı</Label>
                            </div>
                            <div className="border rounded-md">
                              <Input
                                id="customs_duty_rate"
                                type="text"
                                value={formatValue(settings.customs_duty_rate)}
                                onChange={(e) => handleInputChange('customs_duty_rate', e.target.value)}
                                className="w-full text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </div>
                       </div>
                     </div>
                   </div>

                 </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-6">
                  <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  };

  export default AdminIncentiveSettings;