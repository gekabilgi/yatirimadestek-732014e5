import { supabase } from "@/integrations/supabase/client";
import { AdminSetting } from "@/types/adminSettings";
import { MenuVisibilitySettings } from "@/types/menuSettings";

export const menuVisibilityService = {
  async getMenuVisibilitySettings(): Promise<MenuVisibilitySettings> {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('category', 'menu_visibility');

    if (error) {
      console.error('Error fetching menu visibility settings:', error);
      // Return default values if database fetch fails (only Destek Arama visible)
      return {
        menu_item_destek_arama: true,
        menu_item_tesvik_araclari: false,
        menu_item_soru_cevap: false,
        menu_item_tedarik_zinciri: false,
        menu_item_yatirim_firsatlari: false,
        menu_item_yatirimci_sozlugu: false,
        menu_item_basvuru_sureci: false,
      };
    }

    // Start with defaults
    const settings: MenuVisibilitySettings = {
      menu_item_destek_arama: true,
      menu_item_tesvik_araclari: false,
      menu_item_soru_cevap: false,
      menu_item_tedarik_zinciri: false,
      menu_item_yatirim_firsatlari: false,
      menu_item_yatirimci_sozlugu: false,
      menu_item_basvuru_sureci: false,
    };

    // Update with database values
    data?.forEach((setting: AdminSetting) => {
      const key = setting.setting_key as keyof MenuVisibilitySettings;
      if (key in settings) {
        settings[key] = setting.setting_value === 1;
      }
    });

    return settings;
  },

  async updateMenuItemVisibility(menuItemKey: string, isVisible: boolean): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .update({ setting_value: isVisible ? 1 : 0 })
      .eq('setting_key', menuItemKey);

    if (error) {
      throw new Error(`Failed to update ${menuItemKey}: ${error.message}`);
    }
  },

  async updateMultipleMenuItems(updates: Record<string, boolean>): Promise<void> {
    for (const [key, value] of Object.entries(updates)) {
      await this.updateMenuItemVisibility(key, value);
    }
  },
};
