
export interface Question {
  id: string;
  category: string | null;
  question: string;
  answer: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  province: string;
  created_at: string;
  answered: boolean;
  answer_date: string | null;
  sent_to_ydo: boolean;
  sent_to_user: boolean;
  return_status: 'returned' | 'corrected' | null;
  admin_notes: string | null;
  answered_by_user_id: string | null;
  approved_by_admin_id: string | null;
  answer_status: string | null; // Changed from union type to string | null to match database
  return_reason: string | null;
  admin_sent: boolean | null;
  return_date: string | null;
}

export interface YdoUser {
  id: string;
  user_id: string;
  province: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface QnaAdminEmail {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditTrail {
  id: string;
  soru_cevap_id: string;
  action: string;
  user_id: string | null;
  user_role: string | null;
  notes: string | null;
  created_at: string;
}
