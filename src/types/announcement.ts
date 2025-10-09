export interface Announcement {
  id: string;
  institution_name: string;
  institution_logo: string;
  title: string;
  detail: string;
  announcement_date: string;
  external_link?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementFormData {
  institution_logo: string;
  institution_name: string;
  title: string;
  detail: string;
  announcement_date: string;
  external_link?: string;
  is_active: boolean;
  display_order: number;
}
