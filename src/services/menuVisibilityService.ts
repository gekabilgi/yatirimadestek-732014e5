import { supabase } from "@/integrations/supabase/client";
import { MenuVisibilitySettings, MenuVisibilityMode } from "@/types/menuSettings";

export const menuVisibilityService = {
  async getMenuVisibilitySettings(): Promise<MenuVisibilitySettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value_text')
        .eq('category', 'menu_visibility');

      if (error) throw error;

      const settings: MenuVisibilitySettings = {
        menu_item_destek_arama: 'public',
        menu_item_tesvik_araclari: 'anonymous_only',
        menu_item_soru_cevap: 'anonymous_only',
        menu_item_tedarik_zinciri: 'anonymous_only',
        menu_item_yatirim_firsatlari: 'anonymous_only',
        menu_item_yatirimci_sozlugu: 'anonymous_only',
        menu_item_basvuru_sureci: 'anonymous_only',
      };

      data?.forEach((row) => {
        const key = row.setting_key as keyof MenuVisibilitySettings;
        if (key in settings && row.setting_value_text) {
          settings[key] = row.setting_value_text as MenuVisibilityMode;
        }
      });

      return settings;
    } catch (error) {
      console.error('Error fetching menu visibility settings:', error);
      // Return default settings on error
      return {
        menu_item_destek_arama: 'public',
        menu_item_tesvik_araclari: 'anonymous_only',
        menu_item_soru_cevap: 'anonymous_only',
        menu_item_tedarik_zinciri: 'anonymous_only',
        menu_item_yatirim_firsatlari: 'anonymous_only',
        menu_item_yatirimci_sozlugu: 'anonymous_only',
        menu_item_basvuru_sureci: 'anonymous_only',
      };
    }
  },

  async updateMenuItemVisibility(menuItemKey: string, visibilityMode: MenuVisibilityMode): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        category: 'menu_visibility',
        setting_key: menuItemKey,
        setting_value: 0, // Keep for backward compatibility
        setting_value_text: visibilityMode,
      }, {
        onConflict: 'category,setting_key',
      });

    if (error) throw error;
  },

  async updateMultipleMenuItems(updates: Record<string, MenuVisibilityMode>): Promise<void> {
    for (const [key, value] of Object.entries(updates)) {
      await this.updateMenuItemVisibility(key, value);
    }
  },
};
