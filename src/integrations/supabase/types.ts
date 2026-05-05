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
      activity_xp_config: {
        Row: {
          base_xp: number
          created_at: string
          description: string
          display_name: string
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_xp?: number
          created_at?: string
          description?: string
          display_name: string
          id: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_xp?: number
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
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
      companies: {
        Row: {
          created_at: string
          ghl_location_id: string | null
          id: string
          invite_token: string
          name: string
          owner_id: string | null
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ghl_location_id?: string | null
          id?: string
          invite_token?: string
          name: string
          owner_id?: string | null
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ghl_location_id?: string | null
          id?: string
          invite_token?: string
          name?: string
          owner_id?: string | null
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_partner_visibility: {
        Row: {
          company_id: string
          id: string
          partner_id: string
          visible: boolean
        }
        Insert: {
          company_id: string
          id?: string
          partner_id: string
          visible?: boolean
        }
        Update: {
          company_id?: string
          id?: string
          partner_id?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "company_partner_visibility_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_partner_visibility_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
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
      course_lesson_attachments: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          kind: Database["public"]["Enums"]["course_attachment_kind"]
          label: string
          lesson_id: string
          sort_order: number
          url: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          kind: Database["public"]["Enums"]["course_attachment_kind"]
          label: string
          lesson_id: string
          sort_order?: number
          url?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["course_attachment_kind"]
          label?: string
          lesson_id?: string
          sort_order?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lesson_attachments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          body_markdown: string
          created_at: string
          id: string
          is_published: boolean
          module_id: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body_markdown?: string
          created_at?: string
          id?: string
          is_published?: boolean
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body_markdown?: string
          created_at?: string
          id?: string
          is_published?: boolean
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          is_published: boolean
          nav_config_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          nav_config_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          nav_config_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_nav_config_id_fkey"
            columns: ["nav_config_id"]
            isOneToOne: true
            referencedRelation: "sidebar_nav_config"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_card_config: {
        Row: {
          component_key: string
          created_at: string
          default_size: string
          description: string | null
          display_name: string
          id: string
          is_visible: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          component_key: string
          created_at?: string
          default_size?: string
          description?: string | null
          display_name: string
          id: string
          is_visible?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          component_key?: string
          created_at?: string
          default_size?: string
          description?: string | null
          display_name?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          updated_at?: string
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
      feature_flags: {
        Row: {
          enabled: boolean
          id: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          enabled?: boolean
          id: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          enabled?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          name: string
          source_url: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string
          id: string
          is_active?: boolean
          last_synced_at?: string | null
          name: string
          source_url?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          name?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      library_videos: {
        Row: {
          category_id: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "library_categories"
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
      onboarding_content: {
        Row: {
          action_target: string | null
          action_text: string | null
          action_type: string | null
          body: string
          content_type: string
          created_at: string
          day_number: number
          estimated_minutes: number
          horseman_type: string
          id: string
          is_active: boolean
          phase: string
          points_reward: number
          quiz_data: Json | null
          sort_order: number
          title: string
        }
        Insert: {
          action_target?: string | null
          action_text?: string | null
          action_type?: string | null
          body: string
          content_type: string
          created_at?: string
          day_number: number
          estimated_minutes?: number
          horseman_type: string
          id?: string
          is_active?: boolean
          phase: string
          points_reward?: number
          quiz_data?: Json | null
          sort_order?: number
          title: string
        }
        Update: {
          action_target?: string | null
          action_text?: string | null
          action_type?: string | null
          body?: string
          content_type?: string
          created_at?: string
          day_number?: number
          estimated_minutes?: number
          horseman_type?: string
          id?: string
          is_active?: boolean
          phase?: string
          points_reward?: number
          quiz_data?: Json | null
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      page_feedback: {
        Row: {
          archived: boolean
          comment: string | null
          created_at: string
          id: string
          page_route: string
          rating: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          page_route: string
          rating: number
          user_id: string
        }
        Update: {
          archived?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          page_route?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      page_help_content: {
        Row: {
          created_at: string
          help_body: string
          help_title: string
          hint_text: string
          id: string
          is_active: boolean
          page_name: string
          sort_order: number
          updated_at: string
          video_placeholder_text: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          help_body: string
          help_title: string
          hint_text: string
          id: string
          is_active?: boolean
          page_name: string
          sort_order?: number
          updated_at?: string
          video_placeholder_text?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          help_body?: string
          help_title?: string
          hint_text?: string
          id?: string
          is_active?: boolean
          page_name?: string
          sort_order?: number
          updated_at?: string
          video_placeholder_text?: string
          video_url?: string | null
        }
        Relationships: []
      }
      partner_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      partners: {
        Row: {
          category_id: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          partner_url: string
          sort_order: number
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          partner_url?: string
          sort_order?: number
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          partner_url?: string
          sort_order?: number
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "partner_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_generation_events: {
        Row: {
          chosen_strategy_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          latency_ms: number | null
          mode: string | null
          model_variant: string | null
          parser_path: string | null
          ranker_score: number | null
          step_count: number | null
          strategy_source: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          chosen_strategy_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          mode?: string | null
          model_variant?: string | null
          parser_path?: string | null
          ranker_score?: number | null
          step_count?: number | null
          strategy_source?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          chosen_strategy_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          mode?: string | null
          model_variant?: string | null
          parser_path?: string | null
          ranker_score?: number | null
          step_count?: number | null
          strategy_source?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          children_ages: number[] | null
          company: string | null
          company_id: string | null
          company_role: string | null
          created_at: string
          current_streak: number
          current_tier: string
          desired_retirement_income: number | null
          disability_insurance: boolean
          emergency_fund_balance: number | null
          employer_match_captured: string | null
          estimated_annual_leak_high: number | null
          estimated_annual_leak_low: number | null
          estimated_annual_leak_recovered: number | null
          filing_status: string | null
          financial_goals: string[] | null
          full_name: string | null
          ghl_contact_id: string | null
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
          onboarding_completed: boolean
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
          company_id?: string | null
          company_role?: string | null
          created_at?: string
          current_streak?: number
          current_tier?: string
          desired_retirement_income?: number | null
          disability_insurance?: boolean
          emergency_fund_balance?: number | null
          employer_match_captured?: string | null
          estimated_annual_leak_high?: number | null
          estimated_annual_leak_low?: number | null
          estimated_annual_leak_recovered?: number | null
          filing_status?: string | null
          financial_goals?: string[] | null
          full_name?: string | null
          ghl_contact_id?: string | null
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
          onboarding_completed?: boolean
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
          company_id?: string | null
          company_role?: string | null
          created_at?: string
          current_streak?: number
          current_tier?: string
          desired_retirement_income?: number | null
          disability_insurance?: boolean
          emergency_fund_balance?: number | null
          employer_match_captured?: string | null
          estimated_annual_leak_high?: number | null
          estimated_annual_leak_low?: number | null
          estimated_annual_leak_recovered?: number | null
          filing_status?: string | null
          financial_goals?: string[] | null
          full_name?: string | null
          ghl_contact_id?: string | null
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
          onboarding_completed?: boolean
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
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_engine_config: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config: Json
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
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
      sidebar_nav_config: {
        Row: {
          icon: string | null
          id: string
          is_course: boolean
          is_system: boolean
          kind: string
          label: string
          link_type: string
          parent_id: string | null
          sort_order: number
          updated_at: string
          url: string | null
          visible: boolean
        }
        Insert: {
          icon?: string | null
          id: string
          is_course?: boolean
          is_system?: boolean
          kind?: string
          label: string
          link_type?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          url?: string | null
          visible?: boolean
        }
        Update: {
          icon?: string | null
          id?: string
          is_course?: boolean
          is_system?: boolean
          kind?: string
          label?: string
          link_type?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          url?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      strategy_catalog_v2: {
        Row: {
          canonical_strategy_id: string | null
          created_at: string
          dedupe_status: string
          difficulty: string
          effort_level: string | null
          estimated_impact_display: string | null
          estimated_impact_max: number | null
          estimated_impact_min: number | null
          example: string | null
          goal_tags: Json
          horseman_type: string
          id: string
          implementation_steps: Json
          is_active: boolean
          legacy_id: string | null
          potential_savings_benefits: string | null
          requires_advisor: boolean
          sort_order: number
          source_description: string | null
          strategy_details: string
          strategy_id: string
          tax_return_line_or_area: string | null
          time_to_impact: string | null
          title: string
          updated_at: string
          who_best_for: Json
        }
        Insert: {
          canonical_strategy_id?: string | null
          created_at?: string
          dedupe_status?: string
          difficulty?: string
          effort_level?: string | null
          estimated_impact_display?: string | null
          estimated_impact_max?: number | null
          estimated_impact_min?: number | null
          example?: string | null
          goal_tags?: Json
          horseman_type: string
          id: string
          implementation_steps?: Json
          is_active?: boolean
          legacy_id?: string | null
          potential_savings_benefits?: string | null
          requires_advisor?: boolean
          sort_order?: number
          source_description?: string | null
          strategy_details: string
          strategy_id: string
          tax_return_line_or_area?: string | null
          time_to_impact?: string | null
          title: string
          updated_at?: string
          who_best_for?: Json
        }
        Update: {
          canonical_strategy_id?: string | null
          created_at?: string
          dedupe_status?: string
          difficulty?: string
          effort_level?: string | null
          estimated_impact_display?: string | null
          estimated_impact_max?: number | null
          estimated_impact_min?: number | null
          example?: string | null
          goal_tags?: Json
          horseman_type?: string
          id?: string
          implementation_steps?: Json
          is_active?: boolean
          legacy_id?: string | null
          potential_savings_benefits?: string | null
          requires_advisor?: boolean
          sort_order?: number
          source_description?: string | null
          strategy_details?: string
          strategy_id?: string
          tax_return_line_or_area?: string | null
          time_to_impact?: string | null
          title?: string
          updated_at?: string
          who_best_for?: Json
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
        Relationships: []
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
      user_course_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dashboard_card_order: {
        Row: {
          card_id: string
          id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          card_id: string
          id?: string
          sort_order?: number
          user_id: string
        }
        Update: {
          card_id?: string
          id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
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
      user_guide_sections: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_days: Json
          created_at: string
          current_day: number
          current_phase: string
          id: string
          last_completed_date: string | null
          onboarding_start_date: string
          quiz_answers: Json
          reflections: Json
          status: string
          streak_count: number
          total_points_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_days?: Json
          created_at?: string
          current_day?: number
          current_phase?: string
          id?: string
          last_completed_date?: string | null
          onboarding_start_date: string
          quiz_answers?: Json
          reflections?: Json
          status?: string
          streak_count?: number
          total_points_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_days?: Json
          created_at?: string
          current_day?: number
          current_phase?: string
          id?: string
          last_completed_date?: string | null
          onboarding_start_date?: string
          quiz_answers?: Json
          reflections?: Json
          status?: string
          streak_count?: number
          total_points_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      wizard_step_content: {
        Row: {
          id: string
          is_active: boolean
          step_number: number
          subtitle: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id: string
          is_active?: boolean
          step_number: number
          subtitle: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean
          step_number?: number
          subtitle?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      strategy_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_impact: string | null
          financial_goals: string[] | null
          horseman_type: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          sort_order: number | null
          steps: Json | null
          tax_return_line_or_area: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_impact?: string | null
          financial_goals?: never
          horseman_type?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          steps?: Json | null
          tax_return_line_or_area?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_impact?: string | null
          financial_goals?: never
          horseman_type?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          steps?: Json | null
          tax_return_line_or_area?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          banned_until: string
          created_at: string
          current_streak: number
          current_tier: string
          disability_insurance: boolean
          email: string
          email_confirmed_at: string
          emergency_fund_balance: number
          filing_status: string
          financial_goals: string[]
          full_name: string
          health_insurance: boolean
          id: string
          last_sign_in_at: string
          life_insurance: boolean
          long_term_care_insurance: boolean
          monthly_debt_payments: number
          monthly_housing: number
          monthly_income: number
          monthly_insurance: number
          monthly_living_expenses: number
          no_insurance: boolean
          onboarding_completed: boolean
          phone: string
          raw_user_meta_data: Json
          rprx_grade: string
          rprx_score_total: number
          stress_control_feeling: string
          stress_emergency_confidence: string
          stress_money_worry: string
          total_points_earned: number
        }[]
      }
      company_dashboard_stats: {
        Args: { _company_id: string }
        Returns: {
          current_streak: number
          current_tier: string
          full_name: string
          has_assessment: boolean
          joined_at: string
          last_active_date: string
          onboarding_completed: boolean
          total_points_earned: number
          user_id: string
        }[]
      }
      get_company_invite_token: {
        Args: { _company_id: string }
        Returns: string
      }
      get_subscription_tier: { Args: { _user_id: string }; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      lookup_company_by_invite_token: {
        Args: { _token: string }
        Returns: {
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      cash_flow_status: "surplus" | "tight" | "deficit"
      course_attachment_kind: "file" | "link" | "book_call"
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
      course_attachment_kind: ["file", "link", "book_call"],
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
