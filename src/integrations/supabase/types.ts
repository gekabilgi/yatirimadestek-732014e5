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
      sector_search: {
        Row: {
          bolge_1: number | null
          bolge_2: number | null
          bolge_3: number | null
          bolge_4: number | null
          bolge_5: number | null
          bolge_6: number | null
          created_at: string | null
          hedef_yatirim: string | null
          id: number
          nace_kodu: string
          oncelikli_yatirim: string | null
          orta_yuksek_teknoloji: string | null
          sartlar: string | null
          sektor: string
          updated_at: string | null
          yuksek_teknoloji: string | null
        }
        Insert: {
          bolge_1?: number | null
          bolge_2?: number | null
          bolge_3?: number | null
          bolge_4?: number | null
          bolge_5?: number | null
          bolge_6?: number | null
          created_at?: string | null
          hedef_yatirim?: string | null
          id?: number
          nace_kodu: string
          oncelikli_yatirim?: string | null
          orta_yuksek_teknoloji?: string | null
          sartlar?: string | null
          sektor: string
          updated_at?: string | null
          yuksek_teknoloji?: string | null
        }
        Update: {
          bolge_1?: number | null
          bolge_2?: number | null
          bolge_3?: number | null
          bolge_4?: number | null
          bolge_5?: number | null
          bolge_6?: number | null
          created_at?: string | null
          hedef_yatirim?: string | null
          id?: number
          nace_kodu?: string
          oncelikli_yatirim?: string | null
          orta_yuksek_teknoloji?: string | null
          sartlar?: string | null
          sektor?: string
          updated_at?: string | null
          yuksek_teknoloji?: string | null
        }
        Relationships: []
      }
      sgk_durations: {
        Row: {
          created_at: string | null
          description: string | null
          duration_years: number
          id: number
          region_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_years: number
          id?: number
          region_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_years?: number
          id?: number
          region_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
