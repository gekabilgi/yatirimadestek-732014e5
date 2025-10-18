import { supabase } from "@/integrations/supabase/client";
import { MenuVisibilitySettings, MenuItemVisibility, DEFAULT_VISIBILITY } from "@/types/menuSettings";

export const menuVisibilityService = {
  async getMenuVisibilitySettings(): Promise<MenuVisibilitySettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value_text')
        .eq('category', 'menu_visibility');

      if (error) throw error;

      const settings: MenuVisibilitySettings = {
        menu_item_destek_arama: { ...DEFAULT_VISIBILITY },
        menu_item_tesvik_araclari: { ...DEFAULT_VISIBILITY },
        menu_item_soru_cevap: { ...DEFAULT_VISIBILITY },
        menu_item_tedarik_zinciri: { ...DEFAULT_VISIBILITY },
        menu_item_yatirim_firsatlari: { ...DEFAULT_VISIBILITY },
        menu_item_yatirimci_sozlugu: { ...DEFAULT_VISIBILITY },
        menu_item_basvuru_sureci: { ...DEFAULT_VISIBILITY },
      };

      data?.forEach((row) => {
        const key = row.setting_key as keyof MenuVisibilitySettings;
        if (key in settings && row.setting_value_text) {
          try {
            settings[key] = JSON.parse(row.setting_value_text);
          } catch (e) {
            console.error(`Error parsing visibility for ${key}:`, e);
            settings[key] = { ...DEFAULT_VISIBILITY };
          }
        }
      });

      return settings;
    } catch (error) {
      console.error('Error fetching menu visibility settings:', error);
      // Return default settings on error
      return {
        menu_item_destek_arama: { ...DEFAULT_VISIBILITY },
        menu_item_tesvik_araclari: { ...DEFAULT_VISIBILITY },
        menu_item_soru_cevap: { ...DEFAULT_VISIBILITY },
        menu_item_tedarik_zinciri: { ...DEFAULT_VISIBILITY },
        menu_item_yatirim_firsatlari: { ...DEFAULT_VISIBILITY },
        menu_item_yatirimci_sozlugu: { ...DEFAULT_VISIBILITY },
        menu_item_basvuru_sureci: { ...DEFAULT_VISIBILITY },
      };
    }
  },

  async updateMenuItemVisibility(menuItemKey: string, visibility: MenuItemVisibility): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        category: 'menu_visibility',
        setting_key: menuItemKey,
        setting_value: 0, // Keep for backward compatibility
        setting_value_text: JSON.stringify(visibility),
      }, {
        onConflict: 'category,setting_key',
      });

    if (error) throw error;
  },
};
