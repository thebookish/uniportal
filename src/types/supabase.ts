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
      ai_alerts: {
        Row: {
          created_at: string | null
          description: string
          id: string
          read: boolean | null
          recommendations: string[] | null
          severity: string
          student_id: string | null
          title: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          read?: boolean | null
          recommendations?: string[] | null
          severity: string
          student_id?: string | null
          title: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          read?: boolean | null
          recommendations?: string[] | null
          severity?: string
          student_id?: string | null
          title?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_alerts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          auto_alerts_enabled: boolean | null
          auto_recommendations_enabled: boolean | null
          created_at: string | null
          engagement_threshold_low: number | null
          id: string
          inactivity_days_critical: number | null
          inactivity_days_warning: number | null
          risk_threshold_high: number | null
          risk_threshold_moderate: number | null
          updated_at: string | null
        }
        Insert: {
          auto_alerts_enabled?: boolean | null
          auto_recommendations_enabled?: boolean | null
          created_at?: string | null
          engagement_threshold_low?: number | null
          id?: string
          inactivity_days_critical?: number | null
          inactivity_days_warning?: number | null
          risk_threshold_high?: number | null
          risk_threshold_moderate?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_alerts_enabled?: boolean | null
          auto_recommendations_enabled?: boolean | null
          created_at?: string | null
          engagement_threshold_low?: number | null
          id?: string
          inactivity_days_critical?: number | null
          inactivity_days_warning?: number | null
          risk_threshold_high?: number | null
          risk_threshold_moderate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_config: Json
          action_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json
          trigger_type?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          trigger_stage: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          trigger_stage?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          trigger_stage?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          status: string
          student_id: string | null
          subject: string | null
          type: string
          university_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          status: string
          student_id?: string | null
          subject?: string | null
          type: string
          university_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          status?: string
          student_id?: string | null
          subject?: string | null
          type?: string
          university_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_resources: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string
          is_active: boolean | null
          stage: string | null
          title: string
          type: string
          university_id: string | null
          updated_at: string | null
          url: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          stage?: string | null
          title: string
          type: string
          university_id?: string | null
          updated_at?: string | null
          url?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          stage?: string | null
          title?: string
          type?: string
          university_id?: string | null
          updated_at?: string | null
          url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_resources_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          name: string
          status: string
          student_id: string | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          name: string
          status: string
          student_id?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          name?: string
          status?: string
          student_id?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string | null
          error_message: string | null
          from_email: string | null
          from_name: string | null
          id: string
          metadata: Json | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          to_email: string
          to_name: string | null
          university_id: string | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          to_email: string
          to_name?: string | null
          university_id?: string | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string | null
          error_message?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          to_email?: string
          to_name?: string | null
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          university_id: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          university_id?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          university_id?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      external_sources: {
        Row: {
          api_key_encrypted: string | null
          api_url: string | null
          auth_type: string | null
          created_at: string | null
          description: string | null
          field_mappings: Json | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          settings: Json | null
          source_type: string
          sync_frequency: string | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url?: string | null
          auth_type?: string | null
          created_at?: string | null
          description?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          settings?: Json | null
          source_type: string
          sync_frequency?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string | null
          auth_type?: string | null
          created_at?: string | null
          description?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          settings?: Json | null
          source_type?: string
          sync_frequency?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_sources_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_integrations: {
        Row: {
          api_key_encrypted: string | null
          api_url: string
          client_id: string | null
          client_secret_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          oauth_token_encrypted: string | null
          provider: string
          refresh_token_encrypted: string | null
          settings: Json | null
          sync_error: string | null
          sync_status: string | null
          token_expires_at: string | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url: string
          client_id?: string | null
          client_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          oauth_token_encrypted?: string | null
          provider: string
          refresh_token_encrypted?: string | null
          settings?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string
          client_id?: string | null
          client_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          oauth_token_encrypted?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          settings?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_integrations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          change: number
          created_at: string | null
          date: string | null
          id: string
          label: string
          trend: string
          university_id: string | null
          value: number
        }
        Insert: {
          change: number
          created_at?: string | null
          date?: string | null
          id?: string
          label: string
          trend: string
          university_id?: string | null
          value: number
        }
        Update: {
          change?: number
          created_at?: string | null
          date?: string | null
          id?: string
          label?: string
          trend?: string
          university_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations: {
        Row: {
          consequence: string | null
          created_at: string | null
          current_value: string | null
          due_date: string | null
          id: string
          name: string
          requirement: string
          status: string | null
          student_id: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          consequence?: string | null
          created_at?: string | null
          current_value?: string | null
          due_date?: string | null
          id?: string
          name: string
          requirement: string
          status?: string | null
          student_id: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          consequence?: string | null
          created_at?: string | null
          current_value?: string | null
          due_date?: string | null
          id?: string
          name?: string
          requirement?: string
          status?: string | null
          student_id?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obligations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obligations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          order_index: number | null
          status: string
          student_id: string | null
          title: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number | null
          status?: string
          student_id?: string | null
          title: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number | null
          status?: string
          student_id?: string | null
          title?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          capacity: number
          created_at: string | null
          department: string
          eligibility: string[] | null
          enrolled: number | null
          id: string
          intake_date: string
          name: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          department: string
          eligibility?: string[] | null
          enrolled?: number | null
          id?: string
          intake_date: string
          name: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          department?: string
          eligibility?: string[] | null
          enrolled?: number | null
          id?: string
          intake_date?: string
          name?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          counselor_id: string | null
          country: string
          created_at: string | null
          email: string
          engagement_score: number | null
          id: string
          last_activity: string | null
          name: string
          notes: string | null
          phone: string | null
          program_id: string | null
          quality_score: number | null
          risk_score: number | null
          source: string | null
          stage: string
          tags: string[] | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          counselor_id?: string | null
          country: string
          created_at?: string | null
          email: string
          engagement_score?: number | null
          id?: string
          last_activity?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          program_id?: string | null
          quality_score?: number | null
          risk_score?: number | null
          source?: string | null
          stage: string
          tags?: string[] | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          counselor_id?: string | null
          country?: string
          created_at?: string | null
          email?: string
          engagement_score?: number | null
          id?: string
          last_activity?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          program_id?: string | null
          quality_score?: number | null
          risk_score?: number | null
          source?: string | null
          stage?: string
          tags?: string[] | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          id: string
          lms_id: string | null
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          source_id: string | null
          started_at: string | null
          status: string
          university_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          lms_id?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          source_id?: string | null
          started_at?: string | null
          status: string
          university_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          lms_id?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          source_id?: string | null
          started_at?: string | null
          status?: string
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_lms_id_fkey"
            columns: ["lms_id"]
            isOneToOne: false
            referencedRelation: "lms_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "external_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: string
          status: string
          university_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          university_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      university_profile: {
        Row: {
          campuses: string[] | null
          created_at: string | null
          departments: string[] | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          setup_completed: boolean | null
          setup_step: number | null
          updated_at: string | null
        }
        Insert: {
          campuses?: string[] | null
          created_at?: string | null
          departments?: string[] | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          setup_completed?: boolean | null
          setup_step?: number | null
          updated_at?: string | null
        }
        Update: {
          campuses?: string[] | null
          created_at?: string | null
          departments?: string[] | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          setup_completed?: boolean | null
          setup_step?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: string
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lifecycle_stage_counts: {
        Row: {
          count: number | null
          stage: string | null
        }
        Relationships: []
      }
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
