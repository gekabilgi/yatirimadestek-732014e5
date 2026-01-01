import { supabase } from "@/integrations/supabase/client";
import { 
  MenuVisibilitySettings, 
  MenuItemVisibility, 
  DEFAULT_VISIBILITY,
  AdminMenuVisibilitySettings,
  DEFAULT_ADMIN_VISIBILITY,
  DomainMenuSettings
} from "@/types/menuSettings";

// Cache keys and duration
const CACHE_KEY_PREFIX = 'menu_settings_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Get cached data if valid
function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const isValid = Date.now() - entry.timestamp < CACHE_DURATION;
    
    if (isValid) {
      return entry.data;
    }
    
    // Remove expired cache
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
    return null;
  } catch {
    return null;
  }
}

// Set cached data
function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Silent fail - cache is optional
  }
}

// Clear specific cache
function clearCache(key: string): void {
  try {
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
  } catch {
    // Silent fail
  }
}

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

// Get default frontend settings
function getDefaultFrontendSettings(): MenuVisibilitySettings {
  return {
    menu_item_destek_arama: { ...DEFAULT_VISIBILITY },
    menu_item_tesvik_araclari: { ...DEFAULT_VISIBILITY },
    menu_item_soru_cevap: { ...DEFAULT_VISIBILITY },
    menu_item_tedarik_zinciri: { ...DEFAULT_VISIBILITY },
    menu_item_yatirim_firsatlari: { ...DEFAULT_VISIBILITY },
    menu_item_yatirimci_sozlugu: { ...DEFAULT_VISIBILITY },
    menu_item_basvuru_sureci: { ...DEFAULT_VISIBILITY },
    menu_item_chat: { admin: true, registered: true, anonymous: false },
  };
}

// Get default admin settings
function getDefaultAdminSettings(): AdminMenuVisibilitySettings {
  return {
    admin_menu_dashboard: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_qa_management: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_knowledge_base: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_form_builder: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_feasibility_reports: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_support_programs: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_announcements: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_legislation: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_glossary: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_profile: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_user_management: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_email_management: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_supply_chain: { ...DEFAULT_ADMIN_VISIBILITY },
    admin_menu_analytics: { ...DEFAULT_ADMIN_VISIBILITY },
  };
}

export const menuVisibilityService = {
  // ============================================
  // DOMAIN-SPECIFIC MENU SETTINGS (NEW)
  // ============================================

  // Get all configured domains
  async getAllConfiguredDomains(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('domain_menu_settings')
        .select('domain')
        .order('domain');

      if (error) throw error;

      // Get unique domains
      const domains = [...new Set(data?.map(d => d.domain) || [])];
      return domains;
    } catch (error) {
      console.error('Error fetching configured domains:', error);
      return [];
    }
  },

  // Get domain-specific settings for a domain
  async getDomainMenuSettings(domain: string, menuType: 'frontend' | 'admin'): Promise<MenuVisibilitySettings | AdminMenuVisibilitySettings | null> {
    try {
      const { data, error } = await supabase
        .from('domain_menu_settings')
        .select('*')
        .eq('domain', domain.toLowerCase())
        .eq('menu_type', menuType)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.settings) {
        return data.settings as unknown as MenuVisibilitySettings | AdminMenuVisibilitySettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching domain menu settings:', error);
      return null;
    }
  },

  // Save domain-specific settings
  async saveDomainMenuSettings(
    domain: string, 
    menuType: 'frontend' | 'admin', 
    settings: MenuVisibilitySettings | AdminMenuVisibilitySettings
  ): Promise<void> {
    // Use raw query since types might not be updated yet
    const { error } = await supabase
      .from('domain_menu_settings')
      .upsert({
        domain: domain.toLowerCase(),
        menu_type: menuType,
        settings: settings as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'domain,menu_type',
      });

    if (error) throw error;
  },

  // Delete domain settings
  async deleteDomainSettings(domain: string): Promise<void> {
    const { error } = await supabase
      .from('domain_menu_settings')
      .delete()
      .eq('domain', domain.toLowerCase());

    if (error) throw error;
  },

  // Get effective menu settings for current domain
  // Falls back to global settings if no domain-specific settings exist
  async getEffectiveMenuSettings(menuType: 'frontend' | 'admin'): Promise<{
    settings: MenuVisibilitySettings | AdminMenuVisibilitySettings;
    isDomainSpecific: boolean;
    currentDomain: string;
  }> {
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // First check domain-specific settings
    const domainSettings = await this.getDomainMenuSettings(currentDomain, menuType);
    
    if (domainSettings) {
      return {
        settings: domainSettings,
        isDomainSpecific: true,
        currentDomain,
      };
    }

    // Fall back to global settings
    if (menuType === 'frontend') {
      const globalSettings = await this.getMenuVisibilitySettings();
      return {
        settings: globalSettings,
        isDomainSpecific: false,
        currentDomain,
      };
    } else {
      const globalSettings = await this.getAdminMenuVisibilitySettings();
      return {
        settings: globalSettings,
        isDomainSpecific: false,
        currentDomain,
      };
    }
  },

  // ============================================
  // GLOBAL MENU SETTINGS (EXISTING)
  // ============================================

  // Frontend menu visibility (global) - with caching
  async getMenuVisibilitySettings(): Promise<MenuVisibilitySettings> {
    // Check cache first
    const cached = getCachedData<MenuVisibilitySettings>('frontend_global');
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value_text')
        .eq('category', 'menu_visibility');

      if (error) throw error;

      const settings = getDefaultFrontendSettings();

      data?.forEach((row) => {
        const key = row.setting_key as keyof MenuVisibilitySettings;
        if (key in settings && row.setting_value_text) {
          try {
            settings[key] = JSON.parse(row.setting_value_text);
          } catch (e) {
            const oldMode = row.setting_value_text;
            settings[key] = convertOldModeToNew(oldMode);
          }
        }
      });

      // Cache the result
      setCachedData('frontend_global', settings);
      return settings;
    } catch (error) {
      console.error('Error fetching menu visibility settings:', error);
      return getDefaultFrontendSettings();
    }
  },

  async updateMenuItemVisibility(menuItemKey: string, visibility: MenuItemVisibility): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        category: 'menu_visibility',
        setting_key: menuItemKey,
        setting_value: 0,
        setting_value_text: JSON.stringify(visibility),
      }, {
        onConflict: 'category,setting_key',
      });

    if (error) throw error;
  },

  // Admin menu visibility (global)
  async getAdminMenuVisibilitySettings(): Promise<AdminMenuVisibilitySettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value_text')
        .eq('category', 'admin_menu_visibility');

      if (error) throw error;

      const settings = getDefaultAdminSettings();

      data?.forEach((row) => {
        const key = row.setting_key as keyof AdminMenuVisibilitySettings;
        if (key in settings && row.setting_value_text) {
          try {
            settings[key] = JSON.parse(row.setting_value_text);
          } catch (e) {
            settings[key] = { ...DEFAULT_ADMIN_VISIBILITY };
          }
        }
      });

      return settings;
    } catch (error) {
      console.error('Error fetching admin menu visibility settings:', error);
      return getDefaultAdminSettings();
    }
  },

  async updateAdminMenuItemVisibility(menuItemKey: string, visibility: MenuItemVisibility): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        category: 'admin_menu_visibility',
        setting_key: menuItemKey,
        setting_value: 0,
        setting_value_text: JSON.stringify(visibility),
      }, {
        onConflict: 'category,setting_key',
      });

    if (error) throw error;
  },

  // ============================================
  // DEPRECATED: FULL ACCESS DOMAINS
  // These are kept for backward compatibility but
  // domain-specific settings should be used instead
  // ============================================

  async getFullAccessDomains(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value_text')
        .eq('category', 'menu_visibility')
        .eq('setting_key', 'full_access_domains')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.setting_value_text) {
        try {
          return JSON.parse(data.setting_value_text);
        } catch {
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching full access domains:', error);
      return [];
    }
  },

  async updateFullAccessDomains(domains: string[]): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        category: 'menu_visibility',
        setting_key: 'full_access_domains',
        setting_value: 0,
        setting_value_text: JSON.stringify(domains),
      }, {
        onConflict: 'category,setting_key',
      });

    if (error) throw error;
  },

  isFullAccessDomain(domains: string[]): boolean {
    const currentDomain = window.location.hostname;
    return domains.some(domain => {
      const normalizedDomain = domain.toLowerCase().trim();
      const normalizedCurrent = currentDomain.toLowerCase();
      return normalizedCurrent === normalizedDomain || 
             normalizedCurrent.endsWith('.' + normalizedDomain);
    });
  },
};
