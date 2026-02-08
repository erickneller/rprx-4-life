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
      badges: {
        Row: {
          category: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          name?: string
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
          financial_goals: string[] | null
          full_name: string | null
          id: string
          monthly_debt_payments: number | null
          monthly_housing: number | null
          monthly_income: number | null
          monthly_insurance: number | null
          monthly_living_expenses: number | null
          num_children: number | null
          phone: string | null
          profile_type: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          children_ages?: number[] | null
          company?: string | null
          created_at?: string
          financial_goals?: string[] | null
          full_name?: string | null
          id: string
          monthly_debt_payments?: number | null
          monthly_housing?: number | null
          monthly_income?: number | null
          monthly_insurance?: number | null
          monthly_living_expenses?: number | null
          num_children?: number | null
          phone?: string | null
          profile_type?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          children_ages?: number[] | null
          company?: string | null
          created_at?: string
          financial_goals?: string[] | null
          full_name?: string | null
          id?: string
          monthly_debt_payments?: number | null
          monthly_housing?: number | null
          monthly_income?: number | null
          monthly_insurance?: number | null
          monthly_living_expenses?: number | null
          num_children?: number | null
          phone?: string | null
          profile_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_plans: {
        Row: {
          content: Json
          created_at: string | null
          id: string
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
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
    },
  },
} as const
