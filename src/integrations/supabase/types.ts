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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessment_questions: {
        Row: {
          category: string
          created_at: string
          horseman_weights: Json
          id: string
          options: Json
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          category: string
          created_at?: string
          horseman_weights?: Json
          id?: string
          options?: Json
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          category?: string
          created_at?: string
          horseman_weights?: Json
          id?: string
          options?: Json
          order_index?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          question_id: string
          response_value: Json
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          question_id: string
          response_value: Json
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          question_id?: string
          response_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_definitions: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          points: number
          sort_order: number
          trigger_type: string
          trigger_value: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id: string
          is_active?: boolean
          name: string
          points: number
          sort_order?: number
          trigger_type: string
          trigger_value?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          sort_order?: number
          trigger_type?: string
          trigger_value?: Json | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_journeys: {
        Row: {
          completed_at: string | null
          created_at: string
          dream_image_url: string | null
          dream_text: string | null
          focus_debt_id: string | null
          id: string
          status: Database["public"]["Enums"]["journey_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dream_image_url?: string | null
          dream_text?: string | null
          focus_debt_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["journey_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dream_image_url?: string | null
          dream_text?: string | null
          focus_debt_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["journey_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_journeys_focus_debt_id_fkey"
            columns: ["focus_debt_id"]
            isOneToOne: false
            referencedRelation: "user_debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          note: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          note?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          note?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "user_debts"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_dive_questions: {
        Row: {
          created_at: string
          horseman_type: string
          id: string
          options: Json
          order_index: number
          question_text: string
          question_type: string
        }
        Insert: {
          created_at?: string
          horseman_type: string
          id?: string
          options?: Json
          order_index: number
          question_text: string
          question_type: string
        }
        Update: {
          created_at?: string
          horseman_type?: string
          id?: string
          options?: Json
          order_index?: number
          question_text?: string
          question_type?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          children_ages: number[] | null
          company: string | null
          created_at: string
          current_streak: number
          current_tier: string
          desired_retirement_income: number | null
          disability_insurance: boolean
          emergency_fund_balance: number | null
          employer_match_captured: string | null
          filing_status: string | null
          financial_goals: string[] | null
          full_name: string | null
          health_insurance: boolean
          id: string
          last_active_date: string | null
          life_insurance: boolean
          long_term_care_insurance: boolean
          longest_streak: number
          monthly_debt_payments: number | null
          monthly_housing: number | null
          monthly_income: number | null
          monthly_insurance: number | null
          monthly_living_expenses: number | null
          motivation_images: string[] | null
          motivation_text: string | null
          no_insurance: boolean
          num_children: number | null
          phone: string | null
          profile_type: string[] | null
          retirement_balance_total: number | null
          retirement_contribution_monthly: number | null
          rprx_grade: string | null
          rprx_score: number | null
          rprx_score_lake: number | null
          rprx_score_rainbow: number | null
          rprx_score_river: number | null
          rprx_score_stress: number | null
          rprx_score_tax: number | null
          rprx_score_total: number | null
          stress_control_feeling: string | null
          stress_emergency_confidence: string | null
          stress_money_worry: string | null
          tax_advantaged_accounts: Json | null
          total_points_earned: number
          updated_at: string
          years_until_retirement: number | null
        }
        Insert: {
          avatar_url?: string | null
          children_ages?: number[] | null
          company?: string | null
          created_at?: string
          current_streak?: number
          current_tier?: string
          desired_retirement_income?: number | null
          disability_insurance?: boolean
          emergency_fund_balance?: number | null
          employer_match_captured?: string | null
          filing_status?: string | null
          financial_goals?: string[] | null
          full_name?: string | null
          health_insurance?: boolean
          id: string
          last_active_date?: string | null
          life_insurance?: boolean
          long_term_care_insurance?: boolean
          longest_streak?: number
          monthly_debt_payments?: number | null
          monthly_housing?: number | null
          monthly_income?: number | null
          monthly_insurance?: number | null
          monthly_living_expenses?: number | null
          motivation_images?: string[] | null
          motivation_text?: string | null
          no_insurance?: boolean
          num_children?: number | null
          phone?: string | null
          profile_type?: string[] | null
          retirement_balance_total?: number | null
          retirement_contribution_monthly?: number | null
          rprx_grade?: string | null
          rprx_score?: number | null
          rprx_score_lake?: number | null
          rprx_score_rainbow?: number | null
          rprx_score_river?: number | null
          rprx_score_stress?: number | null
          rprx_score_tax?: number | null
          rprx_score_total?: number | null
          stress_control_feeling?: string | null
          stress_emergency_confidence?: string | null
          stress_money_worry?: string | null
          tax_advantaged_accounts?: Json | null
          total_points_earned?: number
          updated_at?: string
          years_until_retirement?: number | null
        }
        Update: {
          avatar_url?: string | null
          children_ages?: number[] | null
          company?: string | null
          created_at?: string
          current_streak?: number
          current_tier?: string
          desired_retirement_income?: number | null
          disability_insurance?: boolean
          emergency_fund_balance?: number | null
          employer_match_captured?: string | null
          filing_status?: string | null
          financial_goals?: string[] | null
          full_name?: string | null
          health_insurance?: boolean
          id?: string
          last_active_date?: string | null
          life_insurance?: boolean
          long_term_care_insurance?: boolean
          longest_streak?: number
          monthly_debt_payments?: number | null
          monthly_housing?: number | null
          monthly_income?: number | null
          monthly_insurance?: number | null
          monthly_living_expenses?: number | null
          motivation_images?: string[] | null
          motivation_text?: string | null
          no_insurance?: boolean
          num_children?: number | null
          phone?: string | null
          profile_type?: string[] | null
          retirement_balance_total?: number | null
          retirement_contribution_monthly?: number | null
          rprx_grade?: string | null
          rprx_score?: number | null
          rprx_score_lake?: number | null
          rprx_score_rainbow?: number | null
          rprx_score_river?: number | null
          rprx_score_stress?: number | null
          rprx_score_tax?: number | null
          rprx_score_total?: number | null
          stress_control_feeling?: string | null
          stress_emergency_confidence?: string | null
          stress_money_worry?: string | null
          tax_advantaged_accounts?: Json | null
          total_points_earned?: number
          updated_at?: string
          years_until_retirement?: number | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          content: string
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          description?: string | null
          id: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      saved_plans: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_focus: boolean
          notes: string | null
          status: Database["public"]["Enums"]["plan_status"]
          strategy_id: string | null
          strategy_name: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          is_focus?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          strategy_id?: string | null
          strategy_name: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_focus?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          strategy_id?: string | null
          strategy_name?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      strategy_definitions: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          estimated_impact: string | null
          financial_goals: string[] | null
          horseman_type: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          steps: Json
          tax_return_line_or_area: string | null
        }
        Insert: {
          created_at?: string
          description: string
          difficulty?: string
          estimated_impact?: string | null
          financial_goals?: string[] | null
          horseman_type: string
          id: string
          is_active?: boolean
          name: string
          sort_order?: number
          steps?: Json
          tax_return_line_or_area?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          estimated_impact?: string | null
          financial_goals?: string[] | null
          horseman_type?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          steps?: Json
          tax_return_line_or_area?: string | null
        }
        Relationships: []
      }
      user_active_strategies: {
        Row: {
          activated_at: string
          completed_at: string | null
          id: string
          notes: string | null
          status: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          strategy_id: string
          user_id: string
        }
        Update: {
          activated_at?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      user_assessments: {
        Row: {
          cash_flow_status:
            | Database["public"]["Enums"]["cash_flow_status"]
            | null
          completed_at: string | null
          created_at: string
          education_score: number
          expense_range: string | null
          id: string
          income_range: string | null
          insurance_score: number
          interest_score: number
          primary_horseman: Database["public"]["Enums"]["horseman_type"] | null
          taxes_score: number
          user_id: string
        }
        Insert: {
          cash_flow_status?:
            | Database["public"]["Enums"]["cash_flow_status"]
            | null
          completed_at?: string | null
          created_at?: string
          education_score?: number
          expense_range?: string | null
          id?: string
          income_range?: string | null
          insurance_score?: number
          interest_score?: number
          primary_horseman?: Database["public"]["Enums"]["horseman_type"] | null
          taxes_score?: number
          user_id: string
        }
        Update: {
          cash_flow_status?:
            | Database["public"]["Enums"]["cash_flow_status"]
            | null
          completed_at?: string | null
          created_at?: string
          education_score?: number
          expense_range?: string | null
          id?: string
          income_range?: string | null
          insurance_score?: number
          interest_score?: number
          primary_horseman?: Database["public"]["Enums"]["horseman_type"] | null
          taxes_score?: number
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          points_awarded: number
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_debts: {
        Row: {
          created_at: string
          current_balance: number
          debt_type: Database["public"]["Enums"]["debt_type"]
          id: string
          interest_rate: number
          journey_id: string
          min_payment: number
          name: string
          original_balance: number
          paid_off_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance: number
          debt_type: Database["public"]["Enums"]["debt_type"]
          id?: string
          interest_rate?: number
          journey_id: string
          min_payment?: number
          name: string
          original_balance: number
          paid_off_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          debt_type?: Database["public"]["Enums"]["debt_type"]
          id?: string
          interest_rate?: number
          journey_id?: string
          min_payment?: number
          name?: string
          original_balance?: number
          paid_off_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_debts_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "debt_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_deep_dives: {
        Row: {
          answers: Json
          assessment_id: string
          completed_at: string
          horseman_type: string
          id: string
          user_id: string
        }
        Insert: {
          answers?: Json
          assessment_id: string
          completed_at?: string
          horseman_type: string
          id?: string
          user_id: string
        }
        Update: {
          answers?: Json
          assessment_id?: string
          completed_at?: string
          horseman_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_deep_dives_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          expires_at: string | null
          id: string
          started_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      get_subscription_tier: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      cash_flow_status: "surplus" | "tight" | "deficit"
      debt_type:
        | "credit_card"
        | "student_loan"
        | "auto_loan"
        | "mortgage"
        | "personal_loan"
        | "medical"
        | "other"
      horseman_type: "interest" | "taxes" | "insurance" | "education"
      journey_status: "active" | "completed" | "paused"
      payment_type: "payment" | "balance_update"
      plan_status: "not_started" | "in_progress" | "completed"
      question_type: "slider" | "single_choice" | "yes_no" | "range_select"
      subscription_tier: "free" | "paid"
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
      app_role: ["admin", "moderator", "user"],
      cash_flow_status: ["surplus", "tight", "deficit"],
      debt_type: [
        "credit_card",
        "student_loan",
        "auto_loan",
        "mortgage",
        "personal_loan",
        "medical",
        "other",
      ],
      horseman_type: ["interest", "taxes", "insurance", "education"],
      journey_status: ["active", "completed", "paused"],
      payment_type: ["payment", "balance_update"],
      plan_status: ["not_started", "in_progress", "completed"],
      question_type: ["slider", "single_choice", "yes_no", "range_select"],
      subscription_tier: ["free", "paid"],
    },
  },
} as const
