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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      authority_members: {
        Row: {
          active: boolean
          created_at: string
          id: string
          organisation_id: string
          role: Database["public"]["Enums"]["authority_role"]
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          organisation_id: string
          role?: Database["public"]["Enums"]["authority_role"]
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          organisation_id?: string
          role?: Database["public"]["Enums"]["authority_role"]
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "authority_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      authority_notes: {
        Row: {
          author_id: string
          created_at: string
          deleted_at: string | null
          id: string
          note: string
          organisation_id: string
          report_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note: string
          organisation_id: string
          report_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          note?: string
          organisation_id?: string
          report_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "authority_notes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authority_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_achievements: {
        Row: {
          code: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_attempts: {
        Row: {
          avg_time_ms: number
          challenge_date: string
          challenge_id: string
          completed_at: string
          correct_count: number
          created_at: string
          id: string
          points_earned: number
          score: number
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_time_ms?: number
          challenge_date: string
          challenge_id: string
          completed_at?: string
          correct_count?: number
          created_at?: string
          id?: string
          points_earned?: number
          score?: number
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_time_ms?: number
          challenge_date?: string
          challenge_id?: string
          completed_at?: string
          correct_count?: number
          created_at?: string
          id?: string
          points_earned?: number
          score?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_duels: {
        Row: {
          challenge_date: string
          challenger_id: string
          challenger_score: number | null
          created_at: string
          id: string
          opponent_id: string
          opponent_score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          challenge_date: string
          challenger_id: string
          challenger_score?: number | null
          created_at?: string
          id?: string
          opponent_id: string
          opponent_score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          challenge_date?: string
          challenger_id?: string
          challenger_score?: number | null
          created_at?: string
          id?: string
          opponent_id?: string
          opponent_score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenge_streaks: {
        Row: {
          created_at: string
          current_streak: number
          last_played_date: string | null
          longest_streak: number
          streak_savers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_played_date?: string | null
          longest_streak?: number
          streak_savers?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_played_date?: string | null
          longest_streak?: number
          streak_savers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_date: string
          created_at: string
          id: string
          questions: Json
        }
        Insert: {
          challenge_date: string
          created_at?: string
          id?: string
          questions: Json
        }
        Update: {
          challenge_date?: string
          created_at?: string
          id?: string
          questions?: Json
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string
          id: string
          message: string
          original_language: string | null
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          original_language?: string | null
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          original_language?: string | null
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmations: {
        Row: {
          created_at: string
          id: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          organisation_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          organisation_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          organisation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          active: boolean
          address: string | null
          area_label: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          logo_url: string | null
          name: string
          organisation_type: Database["public"]["Enums"]["organisation_type"]
          slug: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          address?: string | null
          area_label?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          name: string
          organisation_type?: Database["public"]["Enums"]["organisation_type"]
          slug: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          address?: string | null
          area_label?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          name?: string
          organisation_type?: Database["public"]["Enums"]["organisation_type"]
          slug?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          reason: string
          source_key: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          reason: string
          source_key?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          reason?: string
          source_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_translate: boolean
          avatar_url: string | null
          bio: string | null
          community_points: number
          created_at: string
          id: string
          language_onboarded: boolean
          name: string
          points: number
          preferred_language: string
          recent_languages: string[]
          show_original_first: boolean
          updated_at: string
        }
        Insert: {
          auto_translate?: boolean
          avatar_url?: string | null
          bio?: string | null
          community_points?: number
          created_at?: string
          id: string
          language_onboarded?: boolean
          name?: string
          points?: number
          preferred_language?: string
          recent_languages?: string[]
          show_original_first?: boolean
          updated_at?: string
        }
        Update: {
          auto_translate?: boolean
          avatar_url?: string | null
          bio?: string | null
          community_points?: number
          created_at?: string
          id?: string
          language_onboarded?: boolean
          name?: string
          points?: number
          preferred_language?: string
          recent_languages?: string[]
          show_original_first?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      report_assignments: {
        Row: {
          active: boolean
          assigned_at: string
          assigned_by: string
          assigned_to: string | null
          assignment_note: string
          department_id: string | null
          id: string
          organisation_id: string
          report_id: string
          unassigned_at: string | null
        }
        Insert: {
          active?: boolean
          assigned_at?: string
          assigned_by: string
          assigned_to?: string | null
          assignment_note?: string
          department_id?: string | null
          id?: string
          organisation_id: string
          report_id: string
          unassigned_at?: string | null
        }
        Update: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string
          assigned_to?: string | null
          assignment_note?: string
          department_id?: string | null
          id?: string
          organisation_id?: string
          report_id?: string
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "authority_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_assignments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_assignments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_incidents: {
        Row: {
          canonical_report_id: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          canonical_report_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          canonical_report_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_incidents_canonical_report_id_fkey"
            columns: ["canonical_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["report_status"]
          old_status: Database["public"]["Enums"]["report_status"] | null
          organisation_id: string | null
          reason: string
          report_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["report_status"]
          old_status?: Database["public"]["Enums"]["report_status"] | null
          organisation_id?: string | null
          reason?: string
          report_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["report_status"]
          old_status?: Database["public"]["Enums"]["report_status"] | null
          organisation_id?: string | null
          reason?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_status_history_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_status_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["report_category"]
          closed_at: string | null
          created_at: string
          description: string
          description_en: string | null
          id: string
          image_url: string | null
          incident_id: string | null
          is_emergency: boolean
          latitude: number | null
          longitude: number | null
          organisation_id: string | null
          original_language: string | null
          priority: number
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          title: string
          title_en: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["report_category"]
          closed_at?: string | null
          created_at?: string
          description?: string
          description_en?: string | null
          id?: string
          image_url?: string | null
          incident_id?: string | null
          is_emergency?: boolean
          latitude?: number | null
          longitude?: number | null
          organisation_id?: string | null
          original_language?: string | null
          priority?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          title_en?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          closed_at?: string | null
          created_at?: string
          description?: string
          description_en?: string | null
          id?: string
          image_url?: string | null
          incident_id?: string | null
          is_emergency?: boolean
          latitude?: number | null
          longitude?: number | null
          organisation_id?: string | null
          original_language?: string | null
          priority?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          title_en?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "report_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_evidence: {
        Row: {
          created_at: string
          description: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          organisation_id: string
          report_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          organisation_id: string
          report_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          organisation_id?: string
          report_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_evidence_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      square_blocks: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      square_members: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          last_seen_at: string
          quiet_hours_enabled: boolean
          quiet_hours_end: number
          quiet_hours_start: number
          restricted_until: string | null
          square_id: string
          suspended: boolean
          updated_at: string
          user_id: string
          warnings: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          last_seen_at?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          restricted_until?: string | null
          square_id: string
          suspended?: boolean
          updated_at?: string
          user_id: string
          warnings?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          last_seen_at?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          restricted_until?: string | null
          square_id?: string
          suspended?: boolean
          updated_at?: string
          user_id?: string
          warnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "square_members_square_id_fkey"
            columns: ["square_id"]
            isOneToOne: false
            referencedRelation: "squares"
            referencedColumns: ["id"]
          },
        ]
      }
      square_message_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reason?: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "square_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "square_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      square_messages: {
        Row: {
          ai_image_warning: boolean
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          hidden: boolean
          id: string
          image_path: string | null
          is_bot: boolean
          mentions: string[]
          moderation_reason: string | null
          reply_to_id: string | null
          report_id: string | null
          square_id: string
          thread_id: string
          user_id: string | null
        }
        Insert: {
          ai_image_warning?: boolean
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          hidden?: boolean
          id?: string
          image_path?: string | null
          is_bot?: boolean
          mentions?: string[]
          moderation_reason?: string | null
          reply_to_id?: string | null
          report_id?: string | null
          square_id: string
          thread_id: string
          user_id?: string | null
        }
        Update: {
          ai_image_warning?: boolean
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          hidden?: boolean
          id?: string
          image_path?: string | null
          is_bot?: boolean
          mentions?: string[]
          moderation_reason?: string | null
          reply_to_id?: string | null
          report_id?: string | null
          square_id?: string
          thread_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "square_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "square_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "square_messages_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "square_messages_square_id_fkey"
            columns: ["square_id"]
            isOneToOne: false
            referencedRelation: "squares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "square_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "square_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      square_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "square_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "square_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      square_polls: {
        Row: {
          closes_at: string
          created_at: string
          created_by: string
          id: string
          message_id: string
          options: string[]
          question: string
        }
        Insert: {
          closes_at: string
          created_at?: string
          created_by: string
          id?: string
          message_id: string
          options: string[]
          question: string
        }
        Update: {
          closes_at?: string
          created_at?: string
          created_by?: string
          id?: string
          message_id?: string
          options?: string[]
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "square_polls_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "square_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      square_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "square_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "square_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      square_reads: {
        Row: {
          id: string
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "square_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "square_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      square_threads: {
        Row: {
          created_at: string
          created_by: string | null
          emoji: string
          id: string
          slug: string
          sort_order: number
          square_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          slug: string
          sort_order?: number
          square_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          slug?: string
          sort_order?: number
          square_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "square_threads_square_id_fkey"
            columns: ["square_id"]
            isOneToOne: false
            referencedRelation: "squares"
            referencedColumns: ["id"]
          },
        ]
      }
      squares: {
        Row: {
          area_label: string
          created_at: string
          description: string
          emoji: string
          id: string
          is_public: boolean
          max_participants: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          area_label?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          is_public?: boolean
          max_participants?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          area_label?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          is_public?: boolean
          max_participants?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      translation_cache: {
        Row: {
          approximate: boolean
          created_at: string
          id: string
          source_hash: string
          source_lang: string | null
          source_text: string
          target_lang: string
          translated_text: string
        }
        Insert: {
          approximate?: boolean
          created_at?: string
          id?: string
          source_hash: string
          source_lang?: string | null
          source_text: string
          target_lang: string
          translated_text: string
        }
        Update: {
          approximate?: boolean
          created_at?: string
          id?: string
          source_hash?: string
          source_lang?: string | null
          source_text?: string
          target_lang?: string
          translated_text?: string
        }
        Relationships: []
      }
      translation_reports: {
        Row: {
          created_at: string
          id: string
          note: string | null
          source_text: string
          target_lang: string
          translated_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          source_text: string
          target_lang: string
          translated_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          source_text?: string
          target_lang?: string
          translated_text?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authority_assign_report: {
        Args: {
          _assigned_to?: string
          _department_id?: string
          _note?: string
          _organisation_id: string
          _report_id: string
        }
        Returns: string
      }
      authority_unassign_report: {
        Args: { _reason?: string; _report_id: string }
        Returns: boolean
      }
      authority_update_report_status: {
        Args: {
          _new_status: Database["public"]["Enums"]["report_status"]
          _reason?: string
          _report_id: string
        }
        Returns: Database["public"]["Enums"]["report_status"]
      }
      award_points: {
        Args: {
          _amount: number
          _reason: string
          _source_key?: string
          _user_id: string
        }
        Returns: {
          awarded: boolean
          balance: number
        }[]
      }
      can_manage_report: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_report_case: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      has_authority_role: {
        Args: {
          _organisation_id: string
          _role: Database["public"]["Enums"]["authority_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authority_member: {
        Args: { _organisation_id: string; _user_id: string }
        Returns: boolean
      }
      is_valid_status_transition: {
        Args: {
          _new: Database["public"]["Enums"]["report_status"]
          _old: Database["public"]["Enums"]["report_status"]
        }
        Returns: boolean
      }
      report_handling_organisation: {
        Args: { _report_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      authority_role:
        | "organisation_admin"
        | "case_manager"
        | "field_officer"
        | "viewer"
      organisation_type:
        | "local_authority"
        | "police"
        | "fire"
        | "medical"
        | "utilities"
        | "road_authority"
        | "waste_management"
        | "other"
      report_category:
        | "roads"
        | "electricity"
        | "water"
        | "waste"
        | "environment"
        | "safety"
        | "animals"
        | "other"
      report_status:
        | "reported"
        | "verified"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "rejected"
        | "duplicate"
        | "awaiting_information"
        | "reopened"
        | "closed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      authority_role: [
        "organisation_admin",
        "case_manager",
        "field_officer",
        "viewer",
      ],
      organisation_type: [
        "local_authority",
        "police",
        "fire",
        "medical",
        "utilities",
        "road_authority",
        "waste_management",
        "other",
      ],
      report_category: [
        "roads",
        "electricity",
        "water",
        "waste",
        "environment",
        "safety",
        "animals",
        "other",
      ],
      report_status: [
        "reported",
        "verified",
        "assigned",
        "in_progress",
        "resolved",
        "rejected",
        "duplicate",
        "awaiting_information",
        "reopened",
        "closed",
      ],
    },
  },
} as const
