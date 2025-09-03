import { supabase } from "@/integrations/supabase/client";
import { AdminSetting, IncentiveCalculationSettings } from "@/types/adminSettings";

export const adminSettingsService = {
  async getIncentiveCalculationSettings(): Promise<IncentiveCalculationSettings> {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .in('setting_key', [
        'sgk_employer_premium_rate_manufacturing', 
        'sgk_employer_premium_rate_other',
        'sgk_employee_premium_rate_manufacturing', 
        'sgk_employee_premium_rate_other'
      ])
      .eq('category', 'incentive_calculation');

    if (error) {
      console.error('Error fetching incentive calculation settings:', error);
      // Return default values if database fetch fails
      return {
        sgk_employer_premium_rate_manufacturing: 4355.92,
        sgk_employer_premium_rate_other: 4095.87,
        sgk_employee_premium_rate_manufacturing: 3640.77,
        sgk_employee_premium_rate_other: 3420.64,
      };
    }

    const settings: IncentiveCalculationSettings = {
      sgk_employer_premium_rate_manufacturing: 4355.92, // default
      sgk_employer_premium_rate_other: 4095.87, // default
      sgk_employee_premium_rate_manufacturing: 3640.77, // default
      sgk_employee_premium_rate_other: 3420.64, // default
    };

    data?.forEach((setting: AdminSetting) => {
      if (setting.setting_key === 'sgk_employer_premium_rate_manufacturing') {
        settings.sgk_employer_premium_rate_manufacturing = setting.setting_value;
      } else if (setting.setting_key === 'sgk_employer_premium_rate_other') {
        settings.sgk_employer_premium_rate_other = setting.setting_value;
      } else if (setting.setting_key === 'sgk_employee_premium_rate_manufacturing') {
        settings.sgk_employee_premium_rate_manufacturing = setting.setting_value;
      } else if (setting.setting_key === 'sgk_employee_premium_rate_other') {
        settings.sgk_employee_premium_rate_other = setting.setting_value;
      }
    });

    return settings;
  },

  async updateIncentiveCalculationSettings(settings: IncentiveCalculationSettings): Promise<void> {
    const updates = [
      {
        setting_key: 'sgk_employer_premium_rate_manufacturing',
        setting_value: settings.sgk_employer_premium_rate_manufacturing,
      },
      {
        setting_key: 'sgk_employer_premium_rate_other',
        setting_value: settings.sgk_employer_premium_rate_other,
      },
      {
        setting_key: 'sgk_employee_premium_rate_manufacturing',
        setting_value: settings.sgk_employee_premium_rate_manufacturing,
      },
      {
        setting_key: 'sgk_employee_premium_rate_other',
        setting_value: settings.sgk_employee_premium_rate_other,
      },
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: update.setting_value })
        .eq('setting_key', update.setting_key);

      if (error) {
        throw new Error(`Failed to update ${update.setting_key}: ${error.message}`);
      }
    }
  },

  async getAllSettings(): Promise<AdminSetting[]> {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('setting_key', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return data || [];
  },
};