import { supabase } from "@/integrations/supabase/client";
import { MenuVisibilitySettings, MenuItemVisibility, DEFAULT_VISIBILITY } from "@/types/menuSettings";

// Convert old mode format to new format
function convertOldModeToNew(mode: string): MenuItemVisibility {
  switch (mode) {
    case 'anonymous_only':
      return { admin: false, registered: false, anonymous: true };
    case 'admin_only':
      return { admin: true, registered: false, anonymous: false };
    case 'authenticated':
      return { admin: true, registered: true, anonymous: false };
    case 'public':
      return { admin: true, registered: true, anonymous: true };
    default:
      return { ...DEFAULT_VISIBILITY };
  }
}

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
            // Try to parse as JSON first (new format)
            settings[key] = JSON.parse(row.setting_value_text);
          } catch (e) {
            // If JSON parsing fails, it's in old format - convert it
            const oldMode = row.setting_value_text;
            settings[key] = convertOldModeToNew(oldMode);
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
