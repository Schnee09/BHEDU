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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          class_id: string
          created_at: string | null
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          class_id: string
          created_at?: string | null
          date: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_reports: {
        Row: {
          absent_count: number | null
          attendance_rate: number | null
          class_id: string | null
          created_at: string | null
          date_from: string
          date_to: string
          excused_count: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          late_count: number | null
          present_count: number | null
          report_data: Json | null
          report_type: string
          student_id: string | null
          total_days: number | null
        }
        Insert: {
          absent_count?: number | null
          attendance_rate?: number | null
          class_id?: string | null
          created_at?: string | null
          date_from: string
          date_to: string
          excused_count?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          late_count?: number | null
          present_count?: number | null
          report_data?: Json | null
          report_type: string
          student_id?: string | null
          total_days?: number | null
        }
        Update: {
          absent_count?: number | null
          attendance_rate?: number | null
          class_id?: string | null
          created_at?: string | null
          date_from?: string
          date_to?: string
          excused_count?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          late_count?: number | null
          present_count?: number | null
          report_data?: Json | null
          report_type?: string
          student_id?: string | null
          total_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json | null
          resource_id: string
          resource_type: string
          timestamp: string
          user_agent: string | null
          user_email: string
          user_id: string | null
          user_role: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          resource_id: string
          resource_type: string
          timestamp?: string
          user_agent?: string | null
          user_email: string
          user_id?: string | null
          user_role: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          resource_id?: string
          resource_type?: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string | null
          user_role?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year_id: string | null
          class_type: string | null
          created_at: string | null
          grade_level: string | null
          id: string
          max_capacity: number | null
          name: string
          sessions_per_week: number | null
          subject_group_id: string | null
          teacher_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          class_type?: string | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          max_capacity?: number | null
          name: string
          sessions_per_week?: number | null
          subject_group_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          class_type?: string | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          max_capacity?: number | null
          name?: string
          sessions_per_week?: number | null
          subject_group_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subject_group_id_fkey"
            columns: ["subject_group_id"]
            isOneToOne: false
            referencedRelation: "subject_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_standards: {
        Row: {
          academic_year_id: string
          assessment_criteria: Json | null
          competencies: Json | null
          created_at: string | null
          description: string | null
          grade_level: string
          id: string
          learning_objectives: Json | null
          standard_code: string
          subject_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          assessment_criteria?: Json | null
          competencies?: Json | null
          created_at?: string | null
          description?: string | null
          grade_level: string
          id?: string
          learning_objectives?: Json | null
          standard_code: string
          subject_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          assessment_criteria?: Json | null
          competencies?: Json | null
          created_at?: string | null
          description?: string | null
          grade_level?: string
          id?: string
          learning_objectives?: Json | null
          standard_code?: string
          subject_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_standards_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_standards_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          enrollment_date: string | null
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrollment_date?: string | null
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrollment_date?: string | null
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          weight?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: []
      }
      fee_assignments: {
        Row: {
          academic_year_id: string
          amount: number
          class_id: string | null
          created_at: string
          description: string | null
          fee_type_id: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          amount: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          fee_type_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          fee_type_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_assignments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_assignments_fee_type_id_fkey"
            columns: ["fee_type_id"]
            isOneToOne: false
            referencedRelation: "fee_types"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_types: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          academic_year_id: string | null
          assignment_id: string | null
          category_id: string | null
          class_id: string | null
          component_type: string | null
          created_at: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          points_earned: number | null
          score: number | null
          semester: string | null
          student_id: string
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year_id?: string | null
          assignment_id?: string | null
          category_id?: string | null
          class_id?: string | null
          component_type?: string | null
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          points_earned?: number | null
          score?: number | null
          semester?: string | null
          student_id: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string | null
          assignment_id?: string | null
          category_id?: string | null
          class_id?: string | null
          component_type?: string | null
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          points_earned?: number | null
          score?: number | null
          semester?: string | null
          student_id?: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scales: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          scale: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          scale?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          scale?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guardians: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_emergency_contact: boolean | null
          is_primary_contact: boolean | null
          name: string
          notes: string | null
          occupation: string | null
          phone: string | null
          relationship: string | null
          student_id: string
          updated_at: string | null
          work_phone: string | null
          workplace: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency_contact?: boolean | null
          is_primary_contact?: boolean | null
          name: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          relationship?: string | null
          student_id: string
          updated_at?: string | null
          work_phone?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency_contact?: boolean | null
          is_primary_contact?: boolean | null
          name?: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          relationship?: string | null
          student_id?: string
          updated_at?: string | null
          work_phone?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_errors: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string | null
          field_name: string | null
          id: string
          import_log_id: string
          row_data: Json | null
          row_number: number
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type?: string | null
          field_name?: string | null
          id?: string
          import_log_id: string
          row_data?: Json | null
          row_number: number
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string | null
          field_name?: string | null
          id?: string
          import_log_id?: string
          row_data?: Json | null
          row_number?: number
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_count: number
          error_summary: string | null
          file_name: string | null
          file_size: number | null
          id: string
          import_type: string
          imported_by: string
          processed_rows: number
          started_at: string | null
          status: string
          success_count: number
          total_rows: number
          warning_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_count?: number
          error_summary?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          import_type: string
          imported_by: string
          processed_rows?: number
          started_at?: string | null
          status?: string
          success_count?: number
          total_rows?: number
          warning_count?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_count?: number
          error_summary?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          import_type?: string
          imported_by?: string
          processed_rows?: number
          started_at?: string | null
          status?: string
          success_count?: number
          total_rows?: number
          warning_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          fee_type_id: string | null
          id: string
          invoice_id: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          fee_type_id?: string | null
          id?: string
          invoice_id: string
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          fee_type_id?: string | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_fee_type_id_fkey"
            columns: ["fee_type_id"]
            isOneToOne: false
            referencedRelation: "fee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          academic_year_id: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_amount: number
          status: string
          student_account_id: string | null
          student_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          student_account_id?: string | null
          student_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          status?: string
          student_account_id?: string | null
          student_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_account_id_fkey"
            columns: ["student_account_id"]
            isOneToOne: false
            referencedRelation: "student_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_reference: boolean | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_reference?: boolean | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_reference?: boolean | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_schedule_installments: {
        Row: {
          created_at: string
          description: string | null
          due_date: string
          id: string | null
          installment_number: number
          percentage: number
          schedule_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date: string
          id?: string | null
          installment_number: number
          percentage: number
          schedule_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string | null
          installment_number?: number
          percentage?: number
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_installments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          academic_year_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          schedule_type: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          schedule_type?: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          schedule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method_id: string | null
          received_by: string | null
          reference_number: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method_id?: string | null
          received_by?: string | null
          reference_number?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method_id?: string | null
          received_by?: string | null
          reference_number?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          performed_by: string
          permission_code: string
          reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          performed_by: string
          permission_code: string
          reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string
          permission_code?: string
          reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_logs_performer_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_logs_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_definitions: {
        Row: {
          action: string
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          resource: string
        }
        Insert: {
          action: string
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          resource: string
        }
        Update: {
          action?: string
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact: string | null
          enrollment_date: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          role: string | null
          status: string | null
          student_code: string | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          status?: string | null
          student_code?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          status?: string | null
          student_code?: string | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          class_id: string | null
          created_at: string | null
          id: string
          token: string
          used_at: string | null
          valid_until: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          token: string
          used_at?: string | null
          valid_until: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          token?: string
          used_at?: string | null
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          params: Json
          result_url: string | null
          started_at: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          params: Json
          result_url?: string | null
          started_at?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          params?: Json
          result_url?: string | null
          started_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_code: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_code: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_code?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
      school_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      student_accounts: {
        Row: {
          academic_year_id: string
          balance: number
          created_at: string
          id: string
          notes: string | null
          status: string
          student_id: string
          total_fees: number
          total_paid: number
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          balance?: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          total_fees?: number
          total_paid?: number
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          balance?: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          total_fees?: number
          total_paid?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_accounts_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_conducts: {
        Row: {
          academic_year_id: string
          comments: string | null
          created_at: string | null
          evaluated_at: string | null
          evaluated_by: string | null
          id: string
          rating: string
          student_id: string
          term: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          comments?: string | null
          created_at?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          id?: string
          rating: string
          student_id: string
          term: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          comments?: string | null
          created_at?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          id?: string
          rating?: string
          student_id?: string
          term?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_conducts_evaluator_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_conducts_student_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_conducts_year_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_group_subjects: {
        Row: {
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          subject_group_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          subject_group_id: string
          subject_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          subject_group_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_group_subjects_group_fkey"
            columns: ["subject_group_id"]
            isOneToOne: false
            referencedRelation: "subject_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_group_subjects_subject_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_groups: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          grade_level: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          grade_level?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tuition_config: {
        Row: {
          class_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          monthly_fee: number
          sessions_per_week: number
          updated_at: string | null
        }
        Insert: {
          class_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee: number
          sessions_per_week: number
          updated_at?: string | null
        }
        Update: {
          class_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number
          sessions_per_week?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string
          id: string
          is_denied: boolean | null
          notes: string | null
          permission_code: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by: string
          id?: string
          is_denied?: boolean | null
          notes?: string | null
          permission_code: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string
          id?: string
          is_denied?: boolean | null
          notes?: string | null
          permission_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granter_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_permissions_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_profile_id: { Args: never; Returns: string }
      auth_role: { Args: never; Returns: string }
      batch_insert_enrollments: {
        Args: {
          p_class_id: string
          p_enrollment_date?: string
          p_status?: string
          p_student_ids: string[]
        }
        Returns: number
      }
      calculate_average_grade: {
        Args: {
          p_class_id: string
          p_semester?: string
          p_student_id: string
          p_subject_id: string
        }
        Returns: number
      }
      calculate_overall_grade: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: number
      }
      check_in_with_qr: {
        Args: { p_student_id: string; p_token: string }
        Returns: Json
      }
      convert_student_code_to_vietnamese:
        | { Args: { old_code: string }; Returns: string }
        | { Args: { old_code: string; p_student_id?: string }; Returns: string }
      generate_qr_code:
        | {
            Args: { p_class_id: string; p_valid_minutes?: number }
            Returns: Json
          }
        | {
            Args: {
              p_date: string
              p_expiry_hours?: number
              p_student_id: string
            }
            Returns: {
              code: string
              expires_at: string
            }[]
          }
      get_class_attendance: {
        Args: { p_class_id: string; p_date: string }
        Returns: {
          checked_in_at: string
          status: string
          student_id: string
          student_name: string
        }[]
      }
      get_class_enrollment_count: {
        Args: { p_class_id: string }
        Returns: number
      }
      get_class_tuition: { Args: { p_class_id: string }; Returns: number }
      get_current_user_role: { Args: never; Returns: string }
      get_student_enrollment_count: {
        Args: { p_student_id: string }
        Returns: number
      }
      get_student_with_enrollments: {
        Args: { p_student_id: string }
        Returns: {
          address: string
          class_id: string
          class_name: string
          created_at: string
          date_of_birth: string
          email: string
          emergency_contact: string
          enrollment_date: string
          enrollment_id: string
          enrollment_status: string
          first_name: string
          full_name: string
          id: string
          last_name: string
          phone: string
          role: string
          updated_at: string
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_code: string
          source: string
        }[]
      }
      get_user_statistics: { Args: never; Returns: Json }
      has_active_enrollments: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_email_unique: {
        Args: { p_email: string; p_exclude_id?: string }
        Returns: boolean
      }
      is_enrolled_in_class: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: boolean
      }
      is_student: { Args: { user_id: string }; Returns: boolean }
      is_teacher: { Args: { user_id: string }; Returns: boolean }
      record_exists: {
        Args: { record_id: string; table_name: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { p_permission_code: string; p_user_id: string }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// ============================================
// Custom Types and Helpers (for API compatibility)
// ============================================

/**
 * Course type - extracted from Database for convenience
 */
export type Course = Database['public']['Tables']['courses']['Row'];

/**
 * Table column names helper
 */
export const TableColumns = {
  courses: ['id', 'title', 'description', 'is_published', 'created_at', 'updated_at'] as const,
  lessons: ['id', 'course_id', 'title', 'content', 'order_index', 'is_published', 'created_at', 'updated_at'] as const,
  profiles: ['id', 'user_id', 'full_name', 'role', 'email', 'phone', 'address', 'date_of_birth', 'created_at', 'updated_at'] as const,
};

/**
 * Map database course row to API response format
 */
export function mapCourseToAPI(course: Course) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    is_published: course.is_published,
    created_at: course.created_at,
    updated_at: course.updated_at,
  };
}
