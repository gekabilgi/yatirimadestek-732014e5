export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "user"],
    },
  },
} as const
