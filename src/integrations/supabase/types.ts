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
      account_deletion_requests: {
        Row: {
          cancelled: boolean | null
          cancelled_at: string | null
          executed: boolean | null
          executed_at: string | null
          id: string
          reason: string | null
          requested_at: string
          scheduled_deletion_at: string
          user_id: string
        }
        Insert: {
          cancelled?: boolean | null
          cancelled_at?: string | null
          executed?: boolean | null
          executed_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          scheduled_deletion_at?: string
          user_id: string
        }
        Update: {
          cancelled?: boolean | null
          cancelled_at?: string | null
          executed?: boolean | null
          executed_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          scheduled_deletion_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      archived_accounts: {
        Row: {
          archived_at: string
          archived_reason: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          original_user_id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          school_level: Database["public"]["Enums"]["school_level"] | null
        }
        Insert: {
          archived_at?: string
          archived_reason?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          original_user_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
        }
        Update: {
          archived_at?: string
          archived_reason?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          original_user_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
        }
        Relationships: []
      }
      class_subjects: {
        Row: {
          created_at: string
          id: string
          is_mandatory: boolean
          school_level: Database["public"]["Enums"]["school_level"]
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_mandatory?: boolean
          school_level: Database["public"]["Enums"]["school_level"]
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_mandatory?: boolean
          school_level?: Database["public"]["Enums"]["school_level"]
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cours: {
        Row: {
          auteur_id: string | null
          commentaire_revue: string | null
          date_creation: string | null
          date_modification: string | null
          date_publication: string | null
          description: string | null
          difficulte: number | null
          duree_lecture: number | null
          id: number
          matiere_id: number | null
          meta_description: string | null
          meta_title: string | null
          niveau_id: number | null
          programme_id: number | null
          revieur_id: string | null
          slug: string
          statut: string | null
          titre: string
          version: number | null
        }
        Insert: {
          auteur_id?: string | null
          commentaire_revue?: string | null
          date_creation?: string | null
          date_modification?: string | null
          date_publication?: string | null
          description?: string | null
          difficulte?: number | null
          duree_lecture?: number | null
          id?: number
          matiere_id?: number | null
          meta_description?: string | null
          meta_title?: string | null
          niveau_id?: number | null
          programme_id?: number | null
          revieur_id?: string | null
          slug: string
          statut?: string | null
          titre: string
          version?: number | null
        }
        Update: {
          auteur_id?: string | null
          commentaire_revue?: string | null
          date_creation?: string | null
          date_modification?: string | null
          date_publication?: string | null
          description?: string | null
          difficulte?: number | null
          duree_lecture?: number | null
          id?: number
          matiere_id?: number | null
          meta_description?: string | null
          meta_title?: string | null
          niveau_id?: number | null
          programme_id?: number | null
          revieur_id?: string | null
          slug?: string
          statut?: string | null
          titre?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cours_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cours_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cours_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_chapters: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          order_index: number
          theme: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          order_index?: number
          theme?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
          theme?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_content_chunks: {
        Row: {
          chapter_number: number
          chapter_title: string
          content: string
          created_at: string | null
          id: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          chapter_number: number
          chapter_title: string
          content: string
          created_at?: string | null
          id?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          chapter_number?: number
          chapter_title?: string
          content?: string
          created_at?: string | null
          id?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_materials: {
        Row: {
          chapter_id: string
          created_at: string
          file_size: number | null
          id: string
          title: string
          type: string
          url: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          file_size?: number | null
          id?: string
          title: string
          type: string
          url: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          file_size?: number | null
          id?: string
          title?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "course_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          order_index: number
          school_level: Database["public"]["Enums"]["school_level"]
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number
          school_level: Database["public"]["Enums"]["school_level"]
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number
          school_level?: Database["public"]["Enums"]["school_level"]
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount_euros: number
          amount_percentage: number
          created_at: string
          description: string | null
          id: string
          promo_code: string | null
          referral_id: string | null
          subscription_payment_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_euros: number
          amount_percentage: number
          created_at?: string
          description?: string | null
          id?: string
          promo_code?: string | null
          referral_id?: string | null
          subscription_payment_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_euros?: number
          amount_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          promo_code?: string | null
          referral_id?: string | null
          subscription_payment_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referral_tracking"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "credit_transactions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_subscription_payment_id_fkey"
            columns: ["subscription_payment_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "credit_transactions_subscription_payment_id_fkey"
            columns: ["subscription_payment_id"]
            isOneToOne: false
            referencedRelation: "subscription_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          access_type: string
          accessed_by: string
          created_at: string
          data_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_by: string
          created_at?: string
          data_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_by?: string
          created_at?: string
          data_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_logs_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_access_logs_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "data_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json
          created_at: string
          duration_seconds: number
          id: string
          score: number
          subject_id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          duration_seconds: number
          id?: string
          score: number
          subject_id: string
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          duration_seconds?: number
          id?: string
          score?: number
          subject_id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      formules: {
        Row: {
          display_mode: boolean | null
          id: number
          latex_source: string
          legende: string | null
          position: number | null
          section_id: number
        }
        Insert: {
          display_mode?: boolean | null
          id?: number
          latex_source: string
          legende?: string | null
          position?: number | null
          section_id: number
        }
        Update: {
          display_mode?: boolean | null
          id?: number
          latex_source?: string
          legende?: string | null
          position?: number | null
          section_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "formules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_detection: {
        Row: {
          created_at: string
          details: Json | null
          detected_at: string
          fraud_type: string
          id: string
          referral_id: string | null
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          detected_at?: string
          fraud_type: string
          id?: string
          referral_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          detected_at?: string
          fraud_type?: string
          id?: string
          referral_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_detection_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referral_tracking"
            referencedColumns: ["referral_id"]
          },
          {
            foreignKeyName: "fraud_detection_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_versions: {
        Row: {
          auteur_id: string | null
          commentaire: string | null
          contenu_snapshot: Json | null
          cours_id: number
          date_version: string | null
          diff_json: Json | null
          id: number
          version_numero: number
        }
        Insert: {
          auteur_id?: string | null
          commentaire?: string | null
          contenu_snapshot?: Json | null
          cours_id: number
          date_version?: string | null
          diff_json?: Json | null
          id?: number
          version_numero: number
        }
        Update: {
          auteur_id?: string | null
          commentaire?: string | null
          contenu_snapshot?: Json | null
          cours_id?: number
          date_version?: string | null
          diff_json?: Json | null
          id?: number
          version_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "historique_versions_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number
          created_at: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          tva_amount: number
          tva_percentage: number
          user_id: string
        }
        Insert: {
          amount_ht: number
          amount_ttc: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tva_amount: number
          tva_percentage?: number
          user_id: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tva_amount?: number
          tva_percentage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      linking_codes: {
        Row: {
          child_id: string
          code: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          child_id: string
          code: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          child_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linking_codes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linking_codes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "linking_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linking_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      matieres: {
        Row: {
          active: boolean | null
          icone: string | null
          id: number
          nom: string
          ordre: number | null
          slug: string
        }
        Insert: {
          active?: boolean | null
          icone?: string | null
          id?: number
          nom: string
          ordre?: number | null
          slug: string
        }
        Update: {
          active?: boolean | null
          icone?: string | null
          id?: number
          nom?: string
          ordre?: number | null
          slug?: string
        }
        Relationships: []
      }
      medias: {
        Row: {
          alt_text: string | null
          date_upload: string | null
          hauteur: number | null
          id: number
          largeur: number | null
          legende: string | null
          nom_fichier: string | null
          position: number | null
          section_id: number
          type: string
          uploader_id: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          date_upload?: string | null
          hauteur?: number | null
          id?: number
          largeur?: number | null
          legende?: string | null
          nom_fichier?: string | null
          position?: number | null
          section_id: number
          type: string
          uploader_id?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          date_upload?: string | null
          hauteur?: number | null
          id?: number
          largeur?: number | null
          legende?: string | null
          nom_fichier?: string | null
          position?: number | null
          section_id?: number
          type?: string
          uploader_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "medias_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      niveaux: {
        Row: {
          cycle: string
          id: number
          nom: string
          ordre: number | null
        }
        Insert: {
          cycle: string
          id?: number
          nom: string
          ordre?: number | null
        }
        Update: {
          cycle?: string
          id?: number
          nom?: string
          ordre?: number | null
        }
        Relationships: []
      }
      parent_children: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          parent_id: string
          status: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          parent_id: string
          status?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      parental_consents: {
        Row: {
          child_id: string
          created_at: string
          expires_at: string
          id: string
          parent_email: string
          verification_token: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_email: string
          verification_token: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_email?: string
          verification_token?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parental_consents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_consents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prepaid_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_family_plan: boolean
          notes: string | null
          plan_id: string
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_family_plan?: boolean
          notes?: string | null
          plan_id: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_family_plan?: boolean
          notes?: string | null
          plan_id?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prepaid_codes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_active: boolean | null
          avatar_url: string | null
          created_at: string
          data_processing_consent: boolean | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          parent_consent: boolean | null
          parent_consent_date: string | null
          parent_email: string | null
          parent_verified: boolean | null
          pending_referral_code: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          school_level: Database["public"]["Enums"]["school_level"] | null
          updated_at: string
        }
        Insert: {
          account_active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          data_processing_consent?: boolean | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          parent_consent?: boolean | null
          parent_consent_date?: string | null
          parent_email?: string | null
          parent_verified?: boolean | null
          pending_referral_code?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          updated_at?: string
        }
        Update: {
          account_active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          data_processing_consent?: boolean | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          parent_consent?: boolean | null
          parent_consent_date?: string | null
          parent_email?: string | null
          parent_verified?: boolean | null
          pending_referral_code?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          updated_at?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          annee_scolaire: string
          date_application: string | null
          id: number
          matiere_id: number | null
          niveau_id: number | null
          referentiel_json: Json | null
        }
        Insert: {
          annee_scolaire: string
          date_application?: string | null
          id?: number
          matiere_id?: number | null
          niveau_id?: number | null
          referentiel_json?: Json | null
        }
        Update: {
          annee_scolaire?: string
          date_application?: string | null
          id?: number
          matiere_id?: number | null
          niveau_id?: number | null
          referentiel_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "programmes_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_euros: number
          discount_percentage: number
          expires_at: string | null
          id: string
          used: boolean
          used_at: string | null
          used_for_payment_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_euros: number
          discount_percentage: number
          expires_at?: string | null
          id?: string
          used?: boolean
          used_at?: string | null
          used_for_payment_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_euros?: number
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          used?: boolean
          used_at?: string | null
          used_for_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_used_for_payment_id_fkey"
            columns: ["used_for_payment_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "promo_codes_used_for_payment_id_fkey"
            columns: ["used_for_payment_id"]
            isOneToOne: false
            referencedRelation: "subscription_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          options: Json
          question: string
          school_level: Database["public"]["Enums"]["school_level"]
          subject_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options: Json
          question: string
          school_level: Database["public"]["Enums"]["school_level"]
          subject_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          school_level?: Database["public"]["Enums"]["school_level"]
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          id: string
          is_correct: boolean
          question_id: string
          submitted_at: string | null
          user_answer: string
          user_id: string
        }
        Insert: {
          id?: string
          is_correct: boolean
          question_id: string
          submitted_at?: string | null
          user_answer: string
          user_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          question_id?: string
          submitted_at?: string | null
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_credits: {
        Row: {
          balance_euros: number
          balance_percentage: number
          created_at: string
          id: string
          last_updated: string
          user_id: string
        }
        Insert: {
          balance_euros?: number
          balance_percentage?: number
          created_at?: string
          id?: string
          last_updated?: string
          user_id: string
        }
        Update: {
          balance_euros?: number
          balance_percentage?: number
          created_at?: string
          id?: string
          last_updated?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_discount_history: {
        Row: {
          applied_at: string
          created_at: string
          discount_amount: number
          discount_percentage: number
          final_price: number
          id: string
          notes: string | null
          original_price: number
          referee_id: string
          referrer_id: string
          subscription_payment_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          discount_amount: number
          discount_percentage: number
          final_price: number
          id?: string
          notes?: string | null
          original_price: number
          referee_id: string
          referrer_id: string
          subscription_payment_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          discount_amount?: number
          discount_percentage?: number
          final_price?: number
          id?: string
          notes?: string | null
          original_price?: number
          referee_id?: string
          referrer_id?: string
          subscription_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_discount_history_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_discount_history_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_discount_history_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_discount_history_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_discount_history_subscription_payment_id_fkey"
            columns: ["subscription_payment_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "referral_discount_history_subscription_payment_id_fkey"
            columns: ["subscription_payment_id"]
            isOneToOne: false
            referencedRelation: "subscription_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code_used: string
          created_at: string
          discount_activation_date: string | null
          discount_applied_referee: boolean | null
          discount_applied_referrer: boolean | null
          first_payment_date: string | null
          first_subscription_id: string | null
          id: string
          notes: string | null
          pending_validation: boolean | null
          referee_discount_applied: number | null
          referee_id: string
          referrer_id: string
          status: string
          validation_date: string | null
        }
        Insert: {
          code_used: string
          created_at?: string
          discount_activation_date?: string | null
          discount_applied_referee?: boolean | null
          discount_applied_referrer?: boolean | null
          first_payment_date?: string | null
          first_subscription_id?: string | null
          id?: string
          notes?: string | null
          pending_validation?: boolean | null
          referee_discount_applied?: number | null
          referee_id: string
          referrer_id: string
          status?: string
          validation_date?: string | null
        }
        Update: {
          code_used?: string
          created_at?: string
          discount_activation_date?: string | null
          discount_applied_referee?: boolean | null
          discount_applied_referrer?: boolean | null
          first_payment_date?: string | null
          first_subscription_id?: string | null
          id?: string
          notes?: string | null
          pending_validation?: boolean | null
          referee_discount_applied?: number | null
          referee_id?: string
          referrer_id?: string
          status?: string
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_first_subscription_id_fkey"
            columns: ["first_subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "referrals_first_subscription_id_fkey"
            columns: ["first_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          contenu_texte: string | null
          cours_id: number
          id: number
          ordre: number
          parent_section_id: number | null
          titre: string
          type: string | null
        }
        Insert: {
          contenu_texte?: string | null
          cours_id: number
          id?: number
          ordre: number
          parent_section_id?: number | null
          titre: string
          type?: string | null
        }
        Update: {
          contenu_texte?: string | null
          cours_id?: number
          id?: number
          ordre?: number
          parent_section_id?: number | null
          titre?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_parent_section_id_fkey"
            columns: ["parent_section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: string
          color: string
          created_at: string
          icon_name: string
          id: string
          name: string
        }
        Insert: {
          category: string
          color: string
          created_at?: string
          icon_name: string
          id: string
          name: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          icon_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          is_family_plan: boolean | null
          monthly_price: number
          months_count: number
          notes: string | null
          payment_date: string
          payment_method: string | null
          period_end_date: string
          period_start_date: string
          status: string
          subscription_id: string
          total_amount: number | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          is_family_plan?: boolean | null
          monthly_price?: number
          months_count?: number
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          period_end_date: string
          period_start_date: string
          status?: string
          subscription_id: string
          total_amount?: number | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          is_family_plan?: boolean | null
          monthly_price?: number
          months_count?: number
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          period_end_date?: string
          period_start_date?: string
          status?: string
          subscription_id?: string
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          duration_months: number
          id: string
          is_active: boolean | null
          name: string
          price_family: number
          price_single: number
          total_family: number | null
          total_single: number | null
          updated_at: string
        }
        Insert: {
          billing_period: string
          created_at?: string
          duration_months: number
          id?: string
          is_active?: boolean | null
          name: string
          price_family: number
          price_single: number
          total_family?: number | null
          total_single?: number | null
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_family?: number
          price_single?: number
          total_family?: number | null
          total_single?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          is_family_plan: boolean | null
          months_count: number | null
          plan_id: string
          start_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_family_plan?: boolean | null
          months_count?: number | null
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_family_plan?: boolean | null
          months_count?: number | null
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      time_tracking: {
        Row: {
          chapter_id: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          last_activity_at: string | null
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          last_activity_at?: string | null
          time_spent_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          last_activity_at?: string | null
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted_at: string
          consent_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          consent_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          consent_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          chapter_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          last_position: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "course_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      utilisateurs: {
        Row: {
          actif: boolean | null
          date_inscription: string | null
          email: string
          id: number
          nom: string
          prenom: string
          role: string
        }
        Insert: {
          actif?: boolean | null
          date_inscription?: string | null
          email: string
          id?: number
          nom: string
          prenom: string
          role: string
        }
        Update: {
          actif?: boolean | null
          date_inscription?: string | null
          email?: string
          id?: number
          nom?: string
          prenom?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_subscriptions: {
        Row: {
          billing_period: string | null
          current_price: number | null
          duration_months: number | null
          family_member_count: number | null
          is_active: boolean | null
          last_payment_amount: number | null
          parent_id: string | null
          parent_name: string | null
          payment_date: string | null
          payment_status: string | null
          period_end_date: string | null
          period_start_date: string | null
          plan_name: string | null
          subscription_created_at: string | null
          subscription_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount_paid: number | null
          billing_period: string | null
          is_family_plan: boolean | null
          monthly_price: number | null
          months_count: number | null
          payment_date: string | null
          payment_id: string | null
          payment_method: string | null
          period_end_date: string | null
          period_start_date: string | null
          plan_id: string | null
          plan_name: string | null
          status: string | null
          subscription_status: string | null
          total_amount: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quiz_questions_public: {
        Row: {
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string | null
          options: Json | null
          question: string | null
          school_level: Database["public"]["Enums"]["school_level"] | null
          subject_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string | null
          options?: Json | null
          question?: string | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string | null
          options?: Json | null
          question?: string | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_stats: {
        Row: {
          active_referrals: number | null
          cancelled_referrals: number | null
          code: string | null
          code_created_at: string | null
          current_discount_percentage: number | null
          fraud_referrals: number | null
          user_id: string | null
        }
        Relationships: []
      }
      referral_tracking: {
        Row: {
          code_created_at: string | null
          discount_activation_date: string | null
          discount_amount: number | null
          discount_applied_at: string | null
          discount_history_id: string | null
          discount_percentage: number | null
          final_price: number | null
          first_payment_date: string | null
          original_price: number | null
          payment_date: string | null
          referee_id: string | null
          referee_name: string | null
          referral_code: string | null
          referral_created_at: string | null
          referral_id: string | null
          referrer_id: string | null
          referrer_name: string | null
          status: string | null
        }
        Relationships: []
      }
      user_credit_dashboard: {
        Row: {
          active_referrals_count: number | null
          available_promo_codes: number | null
          balance_euros: number | null
          balance_percentage: number | null
          last_updated: string | null
          recent_transactions: Json | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "referral_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      activate_prepaid_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: {
          message: string
          subscription_id: string
          success: boolean
        }[]
      }
      apply_referee_discount: {
        Args: { p_referee_id: string; p_subscription_payment_id: string }
        Returns: number
      }
      apply_referral_discount: {
        Args: { p_base_price: number; p_user_id: string }
        Returns: number
      }
      apply_referral_discount_with_tracking: {
        Args: { p_base_price: number; p_payment_id?: string; p_user_id: string }
        Returns: {
          discount_amount: number
          discount_percentage: number
          final_price: number
        }[]
      }
      calculate_period_end_date: {
        Args: { plan_id: string; start_date: string }
        Returns: string
      }
      calculate_referral_discount: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_subscription_price: {
        Args: { parent_id: string; plan_id: string }
        Returns: number
      }
      create_parent_child_request: {
        Args: {
          p_child_email?: string
          p_linking_code?: string
          p_parent_id: string
        }
        Returns: Json
      }
      create_subscription_payment: {
        Args: {
          p_payment_date?: string
          p_payment_method?: string
          p_subscription_id: string
        }
        Returns: string
      }
      delete_old_archives: { Args: never; Returns: undefined }
      generate_invoice_number: { Args: never; Returns: string }
      generate_linking_code: { Args: never; Returns: string }
      generate_prepaid_code: { Args: never; Returns: string }
      generate_promo_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_family_member_count: { Args: { parent_id: string }; Returns: number }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_subscription_active: {
        Args: { subscription_id: string }
        Returns: boolean
      }
      log_data_access: {
        Args: {
          p_access_type: string
          p_data_type: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_user_id: string
        }
        Returns: string
      }
      respond_to_link_request: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: Json
      }
      upsert_time_tracking: {
        Args: {
          p_additional_seconds?: number
          p_chapter_id?: string
          p_content_id: string
          p_content_type: string
          p_user_id: string
        }
        Returns: {
          chapter_id: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          last_activity_at: string | null
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "time_tracking"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      use_promo_code: {
        Args: {
          p_original_amount: number
          p_payment_id: string
          p_promo_code: string
          p_user_id: string
        }
        Returns: {
          discount_amount: number
          final_amount: number
          message: string
          valid: boolean
        }[]
      }
      validate_referral_after_delay: {
        Args: { p_referral_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "student"
        | "parent"
        | "teacher"
        | "admin"
        | "editeur"
        | "reviseur"
      school_level:
        | "6ème"
        | "5ème"
        | "4ème"
        | "3ème"
        | "Seconde"
        | "1ère"
        | "Terminale"
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
      app_role: [
        "student",
        "parent",
        "teacher",
        "admin",
        "editeur",
        "reviseur",
      ],
      school_level: [
        "6ème",
        "5ème",
        "4ème",
        "3ème",
        "Seconde",
        "1ère",
        "Terminale",
      ],
    },
  },
} as const
