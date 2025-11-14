export interface MenuItemVisibility {
  admin: boolean;
  registered: boolean;
  anonymous: boolean;
}

export interface MenuVisibilitySettings {
  menu_item_destek_arama: MenuItemVisibility;
  menu_item_tesvik_araclari: MenuItemVisibility;
  menu_item_soru_cevap: MenuItemVisibility;
  menu_item_tedarik_zinciri: MenuItemVisibility;
  menu_item_yatirim_firsatlari: MenuItemVisibility;
  menu_item_yatirimci_sozlugu: MenuItemVisibility;
  menu_item_basvuru_sureci: MenuItemVisibility;
  menu_item_chat: MenuItemVisibility;
}

export const DEFAULT_VISIBILITY: MenuItemVisibility = {
  admin: true,
  registered: false,
  anonymous: false,
};

export interface MenuItem {
  title: string;
  url: string;
  settingKey: keyof MenuVisibilitySettings;
  description: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Destek Arama',
    url: '/searchsupport',
    settingKey: 'menu_item_destek_arama',
    description: 'Kullanıcılar destek programlarını arayabilir',
  },
  {
    title: '9903 | Teşvik Araçları',
    url: '/incentive-tools',
    settingKey: 'menu_item_tesvik_araclari',
    description: 'Teşvik hesaplama araçları ve bilgiler',
  },
  {
    title: 'Soru & Cevap',
    url: '/qna',
    settingKey: 'menu_item_soru_cevap',
    description: 'Sık sorulan sorular ve cevaplar',
  },
  {
    title: 'Tedarik Zinciri Yönetimi',
    url: '/tzy',
    settingKey: 'menu_item_tedarik_zinciri',
    description: 'Tedarik zinciri yönetim sistemi',
  },
  {
    title: 'Yatırım Fırsatları',
    url: '/yatirim-firsatlari',
    settingKey: 'menu_item_yatirim_firsatlari',
    description: 'Mevcut yatırım fırsatları',
  },
  {
    title: 'Yatırımcı Sözlüğü',
    url: '/investor-glossary',
    settingKey: 'menu_item_yatirimci_sozlugu',
    description: 'Yatırım terimleri sözlüğü',
  },
  {
    title: 'Başvuru Süreci',
    url: '/basvuru-sureci',
    settingKey: 'menu_item_basvuru_sureci',
    description: 'Başvuru adımları ve süreçleri',
  },
  {
    title: 'AI Sohbet',
    url: '/chat',
    settingKey: 'menu_item_chat',
    description: 'Yapay zeka destekli tam sayfa sohbet',
  },
];
