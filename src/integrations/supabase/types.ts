export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_statistics: {
        Row: {
          created_at: string
          id: string
          stat_name: string
          stat_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          stat_name: string
          stat_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          stat_name?: string
          stat_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string | null
          id: number
          name: string
          province_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          province_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          province_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "districts_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string
          date: string
          eur_buying: number
          eur_selling: number
          gbp_buying: number
          gbp_selling: number
          id: string
          updated_at: string
          usd_buying: number
          usd_selling: number
        }
        Insert: {
          created_at?: string
          date: string
          eur_buying: number
          eur_selling: number
          gbp_buying: number
          gbp_selling: number
          id?: string
          updated_at?: string
          usd_buying: number
          usd_selling: number
        }
        Update: {
          created_at?: string
          date?: string
          eur_buying?: number
          eur_selling?: number
          gbp_buying?: number
          gbp_selling?: number
          id?: string
          updated_at?: string
          usd_buying?: number
          usd_selling?: number
        }
        Relationships: []
      }
      file_attachments: {
        Row: {
          display_order: number
          file_url: string
          filename: string
          id: string
          support_program_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          display_order?: number
          file_url: string
          filename: string
          id?: string
          support_program_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          display_order?: number
          file_url?: string
          filename?: string
          id?: string
          support_program_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_support_program_id_fkey"
            columns: ["support_program_id"]
            isOneToOne: false
            referencedRelation: "support_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          created_at: string
          definition: string
          id: string
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: string
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      gtipdortlu: {
        Row: {
          created_at: string | null
          description: string
          gtipcode: string
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          gtipcode: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          gtipcode?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      incentive_supports: {
        Row: {
          created_at: string | null
          customs_exemption: boolean | null
          district_id: number
          id: number
          kdv_exemption: boolean | null
          osb_status: boolean
          priority_cap: string | null
          priority_cap_ratio: string | null
          priority_interest_support: string | null
          priority_tax_discount: string | null
          province_id: number
          sgk_duration: string | null
          target_cap: string | null
          target_cap_ratio: string | null
          target_interest_support: string | null
          target_tax_discount: string | null
        }
        Insert: {
          created_at?: string | null
          customs_exemption?: boolean | null
          district_id: number
          id?: number
          kdv_exemption?: boolean | null
          osb_status: boolean
          priority_cap?: string | null
          priority_cap_ratio?: string | null
          priority_interest_support?: string | null
          priority_tax_discount?: string | null
          province_id: number
          sgk_duration?: string | null
          target_cap?: string | null
          target_cap_ratio?: string | null
          target_interest_support?: string | null
          target_tax_discount?: string | null
        }
        Update: {
          created_at?: string | null
          customs_exemption?: boolean | null
          district_id?: number
          id?: number
          kdv_exemption?: boolean | null
          osb_status?: boolean
          priority_cap?: string | null
          priority_cap_ratio?: string | null
          priority_interest_support?: string | null
          priority_tax_discount?: string | null
          province_id?: number
          sgk_duration?: string | null
          target_cap?: string | null
          target_cap_ratio?: string | null
          target_interest_support?: string | null
          target_tax_discount?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incentive_supports_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_supports_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      investment_feasibility_reports: {
        Row: {
          alt_sektor_tanim_tag: string | null
          created_at: string | null
          dokumanlar: string | null
          fizibilitenin_hazirlanma_tarihi: string | null
          geri_odeme_suresi: number | null
          gtip_kodu_tag: string | null
          guncellenme_tarihi: string | null
          hedef_ulke_tag: string | null
          id: string
          il_tag: string | null
          istihdam: number | null
          kalkinma_ajansi_tag: string | null
          keywords_tag: string | null
          link: string | null
          nace_kodu_tanim: string | null
          sabit_yatirim_tutari: number | null
          sabit_yatirim_tutari_aralik_tag: string | null
          ska_tag: string | null
          updated_at: string | null
          ust_sektor_tanim_tag: string | null
          yatirim_boyutu_tag: string | null
          yatirim_konusu: string
        }
        Insert: {
          alt_sektor_tanim_tag?: string | null
          created_at?: string | null
          dokumanlar?: string | null
          fizibilitenin_hazirlanma_tarihi?: string | null
          geri_odeme_suresi?: number | null
          gtip_kodu_tag?: string | null
          guncellenme_tarihi?: string | null
          hedef_ulke_tag?: string | null
          id?: string
          il_tag?: string | null
          istihdam?: number | null
          kalkinma_ajansi_tag?: string | null
          keywords_tag?: string | null
          link?: string | null
          nace_kodu_tanim?: string | null
          sabit_yatirim_tutari?: number | null
          sabit_yatirim_tutari_aralik_tag?: string | null
          ska_tag?: string | null
          updated_at?: string | null
          ust_sektor_tanim_tag?: string | null
          yatirim_boyutu_tag?: string | null
          yatirim_konusu: string
        }
        Update: {
          alt_sektor_tanim_tag?: string | null
          created_at?: string | null
          dokumanlar?: string | null
          fizibilitenin_hazirlanma_tarihi?: string | null
          geri_odeme_suresi?: number | null
          gtip_kodu_tag?: string | null
          guncellenme_tarihi?: string | null
          hedef_ulke_tag?: string | null
          id?: string
          il_tag?: string | null
          istihdam?: number | null
          kalkinma_ajansi_tag?: string | null
          keywords_tag?: string | null
          link?: string | null
          nace_kodu_tanim?: string | null
          sabit_yatirim_tutari?: number | null
          sabit_yatirim_tutari_aralik_tag?: string | null
          ska_tag?: string | null
          updated_at?: string | null
          ust_sektor_tanim_tag?: string | null
          yatirim_boyutu_tag?: string | null
          yatirim_konusu?: string
        }
        Relationships: []
      }
      investments_by_province: {
        Row: {
          created_at: string | null
          id: number
          investment_name: string
          province: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          investment_name: string
          province: string
        }
        Update: {
          created_at?: string | null
          id?: number
          investment_name?: string
          province?: string
        }
        Relationships: []
      }
      location_support: {
        Row: {
          alt_bolge: string | null
          created_at: string | null
          gumruk_muafiyeti: boolean | null
          hedef_faiz_karpayi_do: string | null
          hedef_faiz_karpayi_syt_orani: string | null
          hedef_faiz_karpayi_ust_limit_tutari: string | null
          hedef_vergi_indirimi_yko: string | null
          id: number
          il: string
          ilce: string
          kdv_istisnasi: boolean | null
          oncelikli_faiz_karpayi_do: string | null
          oncelikli_faiz_karpayi_syt_orani: string | null
          oncelikli_faiz_karpayi_ust_limit_tutari: string | null
          oncelikli_vergi_indirimi_yko: string | null
          sgk_destek_suresi: string | null
          updated_at: string | null
        }
        Insert: {
          alt_bolge?: string | null
          created_at?: string | null
          gumruk_muafiyeti?: boolean | null
          hedef_faiz_karpayi_do?: string | null
          hedef_faiz_karpayi_syt_orani?: string | null
          hedef_faiz_karpayi_ust_limit_tutari?: string | null
          hedef_vergi_indirimi_yko?: string | null
          id?: number
          il: string
          ilce: string
          kdv_istisnasi?: boolean | null
          oncelikli_faiz_karpayi_do?: string | null
          oncelikli_faiz_karpayi_syt_orani?: string | null
          oncelikli_faiz_karpayi_ust_limit_tutari?: string | null
          oncelikli_vergi_indirimi_yko?: string | null
          sgk_destek_suresi?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_bolge?: string | null
          created_at?: string | null
          gumruk_muafiyeti?: boolean | null
          hedef_faiz_karpayi_do?: string | null
          hedef_faiz_karpayi_syt_orani?: string | null
          hedef_faiz_karpayi_ust_limit_tutari?: string | null
          hedef_vergi_indirimi_yko?: string | null
          id?: number
          il?: string
          ilce?: string
          kdv_istisnasi?: boolean | null
          oncelikli_faiz_karpayi_do?: string | null
          oncelikli_faiz_karpayi_syt_orani?: string | null
          oncelikli_faiz_karpayi_ust_limit_tutari?: string | null
          oncelikli_vergi_indirimi_yko?: string | null
          sgk_destek_suresi?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nace_codes: {
        Row: {
          code: string
          conditions: string | null
          created_at: string | null
          description: string
          id: number
          is_high_tech: boolean | null
          is_mid_high_tech: boolean | null
          is_priority: boolean | null
          is_target: boolean | null
          min_investment_region_1: number | null
          min_investment_region_2: number | null
          min_investment_region_3: number | null
          min_investment_region_4: number | null
          min_investment_region_5: number | null
          min_investment_region_6: number | null
        }
        Insert: {
          code: string
          conditions?: string | null
          created_at?: string | null
          description: string
          id?: number
          is_high_tech?: boolean | null
          is_mid_high_tech?: boolean | null
          is_priority?: boolean | null
          is_target?: boolean | null
          min_investment_region_1?: number | null
          min_investment_region_2?: number | null
          min_investment_region_3?: number | null
          min_investment_region_4?: number | null
          min_investment_region_5?: number | null
          min_investment_region_6?: number | null
        }
        Update: {
          code?: string
          conditions?: string | null
          created_at?: string | null
          description?: string
          id?: number
          is_high_tech?: boolean | null
          is_mid_high_tech?: boolean | null
          is_priority?: boolean | null
          is_target?: boolean | null
          min_investment_region_1?: number | null
          min_investment_region_2?: number | null
          min_investment_region_3?: number | null
          min_investment_region_4?: number | null
          min_investment_region_5?: number | null
          min_investment_region_6?: number | null
        }
        Relationships: []
      }
      nacedortlu: {
        Row: {
          created_at: string | null
          description: string
          id: number
          nacecode: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: number
          nacecode: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          nacecode?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pre_requests: {
        Row: {
          created_at: string | null
          documents_url: string | null
          e_posta: string
          firma_adi: string
          firma_kisa_adi: string | null
          id: string
          iletisim_kisisi: string
          logo_url: string | null
          on_request_id: string | null
          status: string | null
          talep_icerigi: string
          telefon: string
          unvan: string
          updated_at: string | null
          vergi_kimlik_no: string
        }
        Insert: {
          created_at?: string | null
          documents_url?: string | null
          e_posta: string
          firma_adi: string
          firma_kisa_adi?: string | null
          id?: string
          iletisim_kisisi: string
          logo_url?: string | null
          on_request_id?: string | null
          status?: string | null
          talep_icerigi: string
          telefon: string
          unvan: string
          updated_at?: string | null
          vergi_kimlik_no: string
        }
        Update: {
          created_at?: string | null
          documents_url?: string | null
          e_posta?: string
          firma_adi?: string
          firma_kisa_adi?: string | null
          id?: string
          iletisim_kisisi?: string
          logo_url?: string | null
          on_request_id?: string | null
          status?: string | null
          talep_icerigi?: string
          telefon?: string
          unvan?: string
          updated_at?: string | null
          vergi_kimlik_no?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          basvuru_son_tarihi: string
          created_at: string | null
          firma_olcegi: string
          id: string
          minimum_deneyim: number
          minimum_yerlilik_orani: number
          pre_request_id: string
          status: string | null
          updated_at: string | null
          urun_aciklamasi: string
          urun_grubu_adi: string
        }
        Insert: {
          basvuru_son_tarihi: string
          created_at?: string | null
          firma_olcegi: string
          id?: string
          minimum_deneyim?: number
          minimum_yerlilik_orani?: number
          pre_request_id: string
          status?: string | null
          updated_at?: string | null
          urun_aciklamasi: string
          urun_grubu_adi: string
        }
        Update: {
          basvuru_son_tarihi?: string
          created_at?: string | null
          firma_olcegi?: string
          id?: string
          minimum_deneyim?: number
          minimum_yerlilik_orani?: number
          pre_request_id?: string
          status?: string | null
          updated_at?: string | null
          urun_aciklamasi?: string
          urun_grubu_adi?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_pre_request_id_fkey"
            columns: ["pre_request_id"]
            isOneToOne: false
            referencedRelation: "pre_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      province_region_map: {
        Row: {
          created_at: string | null
          id: number
          province_name: string
          region_number: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          province_name: string
          region_number: number
        }
        Update: {
          created_at?: string | null
          id?: number
          province_name?: string
          region_number?: number
        }
        Relationships: []
      }
      provinces: {
        Row: {
          created_at: string | null
          id: number
          name: string
          region_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          region_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          region_id?: number
        }
        Relationships: []
      }
      qna_admin_emails: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      qna_audit_trail: {
        Row: {
          action: string
          created_at: string
          id: string
          notes: string | null
          soru_cevap_id: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          notes?: string | null
          soru_cevap_id: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          notes?: string | null
          soru_cevap_id?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qna_audit_trail_soru_cevap_id_fkey"
            columns: ["soru_cevap_id"]
            isOneToOne: false
            referencedRelation: "soru_cevap"
            referencedColumns: ["id"]
          },
        ]
      }
      qna_email_logs: {
        Row: {
          created_at: string
          email_subject: string
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sender_email: string
          sent_date: string
          sent_page: string
          soru_cevap_id: string | null
          transmission_status: string
        }
        Insert: {
          created_at?: string
          email_subject: string
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sender_email: string
          sent_date?: string
          sent_page: string
          soru_cevap_id?: string | null
          transmission_status?: string
        }
        Update: {
          created_at?: string
          email_subject?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sender_email?: string
          sent_date?: string
          sent_page?: string
          soru_cevap_id?: string | null
          transmission_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "qna_email_logs_soru_cevap_id_fkey"
            columns: ["soru_cevap_id"]
            isOneToOne: false
            referencedRelation: "soru_cevap"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_search: {
        Row: {
          bolge_1: number | null
          bolge_2: number | null
          bolge_3: number | null
          bolge_4: number | null
          bolge_5: number | null
          bolge_6: number | null
          created_at: string | null
          hedef_yatirim: boolean | null
          id: number
          nace_kodu: string
          oncelikli_yatirim: boolean | null
          orta_yuksek_teknoloji: boolean | null
          sartlar: string | null
          sektor: string
          updated_at: string | null
          yuksek_teknoloji: boolean | null
        }
        Insert: {
          bolge_1?: number | null
          bolge_2?: number | null
          bolge_3?: number | null
          bolge_4?: number | null
          bolge_5?: number | null
          bolge_6?: number | null
          created_at?: string | null
          hedef_yatirim?: boolean | null
          id?: number
          nace_kodu: string
          oncelikli_yatirim?: boolean | null
          orta_yuksek_teknoloji?: boolean | null
          sartlar?: string | null
          sektor: string
          updated_at?: string | null
          yuksek_teknoloji?: boolean | null
        }
        Update: {
          bolge_1?: number | null
          bolge_2?: number | null
          bolge_3?: number | null
          bolge_4?: number | null
          bolge_5?: number | null
          bolge_6?: number | null
          created_at?: string | null
          hedef_yatirim?: boolean | null
          id?: number
          nace_kodu?: string
          oncelikli_yatirim?: boolean | null
          orta_yuksek_teknoloji?: boolean | null
          sartlar?: string | null
          sektor?: string
          updated_at?: string | null
          yuksek_teknoloji?: boolean | null
        }
        Relationships: []
      }
      sgk: {
        Row: {
          alt_bolge: number | null
          bolge: number | null
          district: string | null
          osb_status: boolean | null
          province: string | null
          sgk_duration: number | null
        }
        Insert: {
          alt_bolge?: number | null
          bolge?: number | null
          district?: string | null
          osb_status?: boolean | null
          province?: string | null
          sgk_duration?: number | null
        }
        Update: {
          alt_bolge?: number | null
          bolge?: number | null
          district?: string | null
          osb_status?: boolean | null
          province?: string | null
          sgk_duration?: number | null
        }
        Relationships: []
      }
      sgk_durations: {
        Row: {
          alt_bolge: number | null
          bolge: number | null
          district: string | null
          osb_status: boolean | null
          province: string | null
          sgk_duration: number | null
        }
        Insert: {
          alt_bolge?: number | null
          bolge?: number | null
          district?: string | null
          osb_status?: boolean | null
          province?: string | null
          sgk_duration?: number | null
        }
        Update: {
          alt_bolge?: number | null
          bolge?: number | null
          district?: string | null
          osb_status?: boolean | null
          province?: string | null
          sgk_duration?: number | null
        }
        Relationships: []
      }
      soru_cevap: {
        Row: {
          admin_notes: string | null
          admin_sent: boolean | null
          answer: string | null
          answer_date: string | null
          answer_status: string | null
          answered: boolean
          answered_by_full_name: string | null
          answered_by_user_id: string | null
          approved_by_admin_id: string | null
          category: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          province: string
          question: string
          question_number: number
          return_date: string | null
          return_reason: string | null
          return_status:
            | Database["public"]["Enums"]["return_status_enum"]
            | null
          sent_to_user: boolean
          sent_to_ydo: boolean
        }
        Insert: {
          admin_notes?: string | null
          admin_sent?: boolean | null
          answer?: string | null
          answer_date?: string | null
          answer_status?: string | null
          answered?: boolean
          answered_by_full_name?: string | null
          answered_by_user_id?: string | null
          approved_by_admin_id?: string | null
          category?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          province: string
          question: string
          question_number?: number
          return_date?: string | null
          return_reason?: string | null
          return_status?:
            | Database["public"]["Enums"]["return_status_enum"]
            | null
          sent_to_user?: boolean
          sent_to_ydo?: boolean
        }
        Update: {
          admin_notes?: string | null
          admin_sent?: boolean | null
          answer?: string | null
          answer_date?: string | null
          answer_status?: string | null
          answered?: boolean
          answered_by_full_name?: string | null
          answered_by_user_id?: string | null
          approved_by_admin_id?: string | null
          category?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          province?: string
          question?: string
          question_number?: number
          return_date?: string | null
          return_reason?: string | null
          return_status?:
            | Database["public"]["Enums"]["return_status_enum"]
            | null
          sent_to_user?: boolean
          sent_to_ydo?: boolean
        }
        Relationships: []
      }
      submission_tracking: {
        Row: {
          id: string
          identifier: string
          last_submission: string | null
          submission_count: number | null
          submission_type: string
        }
        Insert: {
          id?: string
          identifier: string
          last_submission?: string | null
          submission_count?: number | null
          submission_type: string
        }
        Update: {
          id?: string
          identifier?: string
          last_submission?: string | null
          submission_count?: number | null
          submission_type?: string
        }
        Relationships: []
      }
      supplier_applications: {
        Row: {
          created_at: string | null
          e_posta: string
          firma_adi: string
          firma_olcegi: string
          id: string
          il: string
          iletisim_kisisi: string
          product_id: string
          status: string | null
          telefon: string
          unvan: string
          vergi_kimlik_no: string
        }
        Insert: {
          created_at?: string | null
          e_posta: string
          firma_adi: string
          firma_olcegi: string
          id?: string
          il: string
          iletisim_kisisi: string
          product_id: string
          status?: string | null
          telefon: string
          unvan: string
          vergi_kimlik_no: string
        }
        Update: {
          created_at?: string | null
          e_posta?: string
          firma_adi?: string
          firma_olcegi?: string
          id?: string
          il?: string
          iletisim_kisisi?: string
          product_id?: string
          status?: string | null
          telefon?: string
          unvan?: string
          vergi_kimlik_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_applications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      support_program_tags: {
        Row: {
          created_at: string | null
          id: string
          support_program_id: string | null
          tag_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          support_program_id?: string | null
          tag_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          support_program_id?: string | null
          tag_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_program_tags_support_program_id_fkey"
            columns: ["support_program_id"]
            isOneToOne: false
            referencedRelation: "support_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_program_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      support_programs: {
        Row: {
          application_deadline: string | null
          contact_info: string | null
          created_at: string | null
          description: string
          eligibility_criteria: string | null
          id: string
          institution_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          application_deadline?: string | null
          contact_info?: string | null
          created_at?: string | null
          description: string
          eligibility_criteria?: string | null
          id?: string
          institution_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          application_deadline?: string | null
          contact_info?: string | null
          created_at?: string | null
          description?: string
          eligibility_criteria?: string | null
          id?: string
          institution_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_categories: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          category_id: number | null
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tag_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ydo_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          province: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          province: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          province?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_submission_spam: {
        Args: {
          p_identifier: string
          p_submission_type: string
          p_cooldown_minutes?: number
        }
        Returns: boolean
      }
      expire_old_products: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_stat: {
        Args: { stat_name_param: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_qna_audit: {
        Args: {
          p_soru_cevap_id: string
          p_action: string
          p_user_role?: string
          p_notes?: string
        }
        Returns: undefined
      }
      record_submission: {
        Args: { p_identifier: string; p_submission_type: string }
        Returns: undefined
      }
    }
    Enums: {
      return_status_enum: "returned" | "corrected"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      return_status_enum: ["returned", "corrected"],
      user_role: ["admin", "user"],
    },
  },
} as const
