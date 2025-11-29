export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      company_risk_profiles: {
        Row: {
          address: string | null
          adverse_media_links: Json | null
          adverse_media_mentions: number | null
          adverse_media_risk_score: number | null
          adverse_media_summary: string | null
          checked_at: string | null
          city: string | null
          closed_status: string | null
          company_name: string | null
          company_type_code: string | null
          has_insolvency: boolean | null
          has_insolvency_history: boolean | null
          id: string
          insolvency_court_name: string | null
          insolvency_details: string | null
          insolvency_ended_date: string | null
          insolvency_form: string | null
          insolvency_started_date: string | null
          insolvency_type: string | null
          is_active: boolean | null
          is_pep: boolean | null
          is_sanctioned: boolean | null
          legal_form: string | null
          overall_risk_level: string | null
          pep_details: Json | null
          profile_data: Json | null
          region: string | null
          registered_date: string | null
          registration_date: string | null
          registration_number: string
          regtype_text: string | null
          risk_level: string | null
          sanction_details: Json | null
          sanction_sources: Json | null
          sanctions_details: Json | null
          sanctions_match: boolean | null
          sepa: string | null
          submission_id: string
          tax_explanation: string | null
          tax_rating: string | null
          tax_rating_updated_date: string | null
          tax_status_explanation: string | null
          terminated_date: string | null
          vies_address: string | null
          vies_valid: boolean | null
        }
        Insert: {
          address?: string | null
          adverse_media_links?: Json | null
          adverse_media_mentions?: number | null
          adverse_media_risk_score?: number | null
          adverse_media_summary?: string | null
          checked_at?: string | null
          city?: string | null
          closed_status?: string | null
          company_name?: string | null
          company_type_code?: string | null
          has_insolvency?: boolean | null
          has_insolvency_history?: boolean | null
          id?: string
          insolvency_court_name?: string | null
          insolvency_details?: string | null
          insolvency_ended_date?: string | null
          insolvency_form?: string | null
          insolvency_started_date?: string | null
          insolvency_type?: string | null
          is_active?: boolean | null
          is_pep?: boolean | null
          is_sanctioned?: boolean | null
          legal_form?: string | null
          overall_risk_level?: string | null
          pep_details?: Json | null
          profile_data?: Json | null
          region?: string | null
          registered_date?: string | null
          registration_date?: string | null
          registration_number: string
          regtype_text?: string | null
          risk_level?: string | null
          sanction_details?: Json | null
          sanction_sources?: Json | null
          sanctions_details?: Json | null
          sanctions_match?: boolean | null
          sepa?: string | null
          submission_id: string
          tax_explanation?: string | null
          tax_rating?: string | null
          tax_rating_updated_date?: string | null
          tax_status_explanation?: string | null
          terminated_date?: string | null
          vies_address?: string | null
          vies_valid?: boolean | null
        }
        Update: {
          address?: string | null
          adverse_media_links?: Json | null
          adverse_media_mentions?: number | null
          adverse_media_risk_score?: number | null
          adverse_media_summary?: string | null
          checked_at?: string | null
          city?: string | null
          closed_status?: string | null
          company_name?: string | null
          company_type_code?: string | null
          has_insolvency?: boolean | null
          has_insolvency_history?: boolean | null
          id?: string
          insolvency_court_name?: string | null
          insolvency_details?: string | null
          insolvency_ended_date?: string | null
          insolvency_form?: string | null
          insolvency_started_date?: string | null
          insolvency_type?: string | null
          is_active?: boolean | null
          is_pep?: boolean | null
          is_sanctioned?: boolean | null
          legal_form?: string | null
          overall_risk_level?: string | null
          pep_details?: Json | null
          profile_data?: Json | null
          region?: string | null
          registered_date?: string | null
          registration_date?: string | null
          registration_number?: string
          regtype_text?: string | null
          risk_level?: string | null
          sanction_details?: Json | null
          sanction_sources?: Json | null
          sanctions_details?: Json | null
          sanctions_match?: boolean | null
          sepa?: string | null
          submission_id?: string
          tax_explanation?: string | null
          tax_rating?: string | null
          tax_rating_updated_date?: string | null
          tax_status_explanation?: string | null
          terminated_date?: string | null
          vies_address?: string | null
          vies_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_risk_profiles_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "kyb_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      kyb_requests: {
        Row: {
          company_registration_number: string
          created_at: string
          id: string
          requester_email: string
          status: string
          updated_at: string
        }
        Insert: {
          company_registration_number: string
          created_at?: string
          id?: string
          requester_email: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_registration_number?: string
          created_at?: string
          id?: string
          requester_email?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      kyb_submissions: {
        Row: {
          applicant_email: string | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          company_name: string | null
          company_registration_date: string | null
          company_registration_number: string | null
          completed_at: string | null
          country_of_registration: string | null
          created_at: string
          entity_type: string | null
          goods_or_services: string | null
          id: string
          incoming_payment_countries: string | null
          incoming_payments_monthly_euro: string | null
          incoming_transaction_amount: string | null
          industry: string | null
          outgoing_payment_countries: string | null
          outgoing_payments_monthly_euro: string | null
          outgoing_transaction_amount: string | null
          results: Json | null
          status: string | null
          step_1_completed: boolean | null
          step_2_completed: boolean | null
          step_3_completed: boolean | null
          step_4_completed: boolean | null
          sub_industry: string | null
          trades_under_different_name: boolean | null
          trading_name: string | null
          updated_at: string
          user_id: string
          website_or_business_channel: string | null
        }
        Insert: {
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          company_name?: string | null
          company_registration_date?: string | null
          company_registration_number?: string | null
          completed_at?: string | null
          country_of_registration?: string | null
          created_at?: string
          entity_type?: string | null
          goods_or_services?: string | null
          id?: string
          incoming_payment_countries?: string | null
          incoming_payments_monthly_euro?: string | null
          incoming_transaction_amount?: string | null
          industry?: string | null
          outgoing_payment_countries?: string | null
          outgoing_payments_monthly_euro?: string | null
          outgoing_transaction_amount?: string | null
          results?: Json | null
          status?: string | null
          step_1_completed?: boolean | null
          step_2_completed?: boolean | null
          step_3_completed?: boolean | null
          step_4_completed?: boolean | null
          sub_industry?: string | null
          trades_under_different_name?: boolean | null
          trading_name?: string | null
          updated_at?: string
          user_id: string
          website_or_business_channel?: string | null
        }
        Update: {
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          company_name?: string | null
          company_registration_date?: string | null
          company_registration_number?: string | null
          completed_at?: string | null
          country_of_registration?: string | null
          created_at?: string
          entity_type?: string | null
          goods_or_services?: string | null
          id?: string
          incoming_payment_countries?: string | null
          incoming_payments_monthly_euro?: string | null
          incoming_transaction_amount?: string | null
          industry?: string | null
          outgoing_payment_countries?: string | null
          outgoing_payments_monthly_euro?: string | null
          outgoing_transaction_amount?: string | null
          results?: Json | null
          status?: string | null
          step_1_completed?: boolean | null
          step_2_completed?: boolean | null
          step_3_completed?: boolean | null
          step_4_completed?: boolean | null
          sub_industry?: string | null
          trades_under_different_name?: boolean | null
          trading_name?: string | null
          updated_at?: string
          user_id?: string
          website_or_business_channel?: string | null
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
    Enums: {},
  },
} as const
