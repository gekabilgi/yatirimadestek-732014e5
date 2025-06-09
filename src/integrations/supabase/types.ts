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
      incentive_programs: {
        Row: {
          available_supports: string[] | null
          created_at: string | null
          duration_years: number | null
          id: string
          incentive_type_id: number | null
          investment_subject_id: number | null
          is_active: boolean | null
          machine_price_threshold: number | null
          max_amount: number | null
          max_employees: number | null
          min_investment_threshold: number | null
          rate: number
          region_id: number | null
          regional_variations: Json | null
          sector_id: number | null
          updated_at: string | null
        }
        Insert: {
          available_supports?: string[] | null
          created_at?: string | null
          duration_years?: number | null
          id?: string
          incentive_type_id?: number | null
          investment_subject_id?: number | null
          is_active?: boolean | null
          machine_price_threshold?: number | null
          max_amount?: number | null
          max_employees?: number | null
          min_investment_threshold?: number | null
          rate: number
          region_id?: number | null
          regional_variations?: Json | null
          sector_id?: number | null
          updated_at?: string | null
        }
        Update: {
          available_supports?: string[] | null
          created_at?: string | null
          duration_years?: number | null
          id?: string
          incentive_type_id?: number | null
          investment_subject_id?: number | null
          is_active?: boolean | null
          machine_price_threshold?: number | null
          max_amount?: number | null
          max_employees?: number | null
          min_investment_threshold?: number | null
          rate?: number
          region_id?: number | null
          regional_variations?: Json | null
          sector_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incentive_programs_incentive_type_id_fkey"
            columns: ["incentive_type_id"]
            isOneToOne: false
            referencedRelation: "incentive_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_programs_investment_subject_id_fkey"
            columns: ["investment_subject_id"]
            isOneToOne: false
            referencedRelation: "investment_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_programs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_programs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      investment_subjects: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      nace_codes: {
        Row: {
          code: string
          created_at: string | null
          description: string
          id: number
          is_priority: boolean | null
          sector_id: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          id?: number
          is_priority?: boolean | null
          sector_id?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          id?: number
          is_priority?: boolean | null
          sector_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nace_codes_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      province_investment_thresholds: {
        Row: {
          created_at: string | null
          id: string
          investment_subject_id: number | null
          min_investment_amount: number
          province_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          investment_subject_id?: number | null
          min_investment_amount: number
          province_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          investment_subject_id?: number | null
          min_investment_amount?: number
          province_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "province_investment_thresholds_investment_subject_id_fkey"
            columns: ["investment_subject_id"]
            isOneToOne: false
            referencedRelation: "investment_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "province_investment_thresholds_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_provinces_region"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string | null
          id: number
          level: string
          multiplier: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          level: string
          multiplier?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          level?: string
          multiplier?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_priority: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_priority?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_priority?: boolean | null
          name?: string
          updated_at?: string | null
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
