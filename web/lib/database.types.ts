export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          id: string;
          is_current: boolean | null;
          name: string;
          start_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_current?: boolean | null;
          name: string;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_current?: boolean | null;
          name?: string;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          check_in_time: string | null;
          check_out_time: string | null;
          class_id: string;
          created_at: string | null;
          date: string;
          id: string;
          marked_by: string | null;
          notes: string | null;
          status: string | null;
          student_id: string;
        };
        Insert: {
          check_in_time?: string | null;
          check_out_time?: string | null;
          class_id: string;
          created_at?: string | null;
          date: string;
          id?: string;
          marked_by?: string | null;
          notes?: string | null;
          status?: string | null;
          student_id: string;
        };
        Update: {
          check_in_time?: string | null;
          check_out_time?: string | null;
          class_id?: string;
          created_at?: string | null;
          date?: string;
          id?: string;
          marked_by?: string | null;
          notes?: string | null;
          status?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_marked_by_fkey";
            columns: ["marked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_reports: {
        Row: {
          absent_count: number | null;
          attendance_rate: number | null;
          class_id: string | null;
          created_at: string | null;
          date_from: string;
          date_to: string;
          excused_count: number | null;
          generated_at: string | null;
          generated_by: string | null;
          id: string;
          late_count: number | null;
          present_count: number | null;
          report_data: Json | null;
          report_type: string;
          student_id: string | null;
          total_days: number | null;
        };
        Insert: {
          absent_count?: number | null;
          attendance_rate?: number | null;
          class_id?: string | null;
          created_at?: string | null;
          date_from: string;
          date_to: string;
          excused_count?: number | null;
          generated_at?: string | null;
          generated_by?: string | null;
          id?: string;
          late_count?: number | null;
          present_count?: number | null;
          report_data?: Json | null;
          report_type: string;
          student_id?: string | null;
          total_days?: number | null;
        };
        Update: {
          absent_count?: number | null;
          attendance_rate?: number | null;
          class_id?: string | null;
          created_at?: string | null;
          date_from?: string;
          date_to?: string;
          excused_count?: number | null;
          generated_at?: string | null;
          generated_by?: string | null;
          id?: string;
          late_count?: number | null;
          present_count?: number | null;
          report_data?: Json | null;
          report_type?: string;
          student_id?: string | null;
          total_days?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_reports_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_reports_generated_by_fkey";
            columns: ["generated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_reports_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_events: {
        Row: {
          class_id: string | null;
          color: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_date: string | null;
          end_time: string | null;
          event_type: string | null;
          id: string;
          is_all_day: boolean | null;
          semester_id: string | null;
          start_date: string;
          start_time: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          class_id?: string | null;
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          event_type?: string | null;
          id?: string;
          is_all_day?: boolean | null;
          semester_id?: string | null;
          start_date: string;
          start_time?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          class_id?: string | null;
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          event_type?: string | null;
          id?: string;
          is_all_day?: boolean | null;
          semester_id?: string | null;
          start_date?: string;
          start_time?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_events_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          academic_year_id: string | null;
          capacity: number | null;
          class_type: string | null;
          course_id: string | null;
          created_at: string | null;
          grade_level: string | null;
          id: string;
          max_capacity: number | null;
          name: string;
          room: string | null;
          schedule: string | null;
          sessions_per_week: number | null;
          status: string | null;
          subject_group_id: string | null;
          teacher_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          academic_year_id?: string | null;
          capacity?: number | null;
          class_type?: string | null;
          course_id?: string | null;
          created_at?: string | null;
          grade_level?: string | null;
          id?: string;
          max_capacity?: number | null;
          name: string;
          room?: string | null;
          schedule?: string | null;
          sessions_per_week?: number | null;
          status?: string | null;
          subject_group_id?: string | null;
          teacher_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          academic_year_id?: string | null;
          capacity?: number | null;
          class_type?: string | null;
          course_id?: string | null;
          created_at?: string | null;
          grade_level?: string | null;
          id?: string;
          max_capacity?: number | null;
          name?: string;
          room?: string | null;
          schedule?: string | null;
          sessions_per_week?: number | null;
          status?: string | null;
          subject_group_id?: string | null;
          teacher_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          academic_year_id: string | null;
          class_id: string | null;
          code: string | null;
          created_at: string | null;
          description: string | null;
          grade_level: number | null;
          hours_per_week: number | null;
          id: string;
          is_active: boolean | null;
          is_required: boolean | null;
          name: string;
          name_vi: string | null;
          semester: number | null;
          subject_id: string | null;
          teacher_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          academic_year_id?: string | null;
          class_id?: string | null;
          code?: string | null;
          created_at?: string | null;
          description?: string | null;
          grade_level?: number | null;
          hours_per_week?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          name: string;
          name_vi?: string | null;
          semester?: number | null;
          subject_id?: string | null;
          teacher_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          academic_year_id?: string | null;
          class_id?: string | null;
          code?: string | null;
          created_at?: string | null;
          description?: string | null;
          grade_level?: number | null;
          hours_per_week?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          name?: string;
          name_vi?: string | null;
          semester?: number | null;
          subject_id?: string | null;
          teacher_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          class_id: string;
          enrollment_date: string | null;
          id: string;
          status: string | null;
          student_id: string;
        };
        Insert: {
          class_id: string;
          enrollment_date?: string | null;
          id?: string;
          status?: string | null;
          student_id: string;
        };
        Update: {
          class_id?: string;
          enrollment_date?: string | null;
          id?: string;
          status?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      evaluation_types: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          weight: number;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          weight?: number;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          weight?: number;
        };
        Relationships: [];
      };
      fee_assignments: {
        Row: {
          academic_year_id: string;
          amount: number;
          class_id: string | null;
          created_at: string;
          description: string | null;
          fee_type_id: string;
          id: string;
          is_active: boolean | null;
          updated_at: string;
        };
        Insert: {
          academic_year_id: string;
          amount: number;
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          fee_type_id: string;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          amount?: number;
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          fee_type_id?: string;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fee_assignments_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fee_assignments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fee_assignments_fee_type_id_fkey";
            columns: ["fee_type_id"];
            isOneToOne: false;
            referencedRelation: "fee_types";
            referencedColumns: ["id"];
          },
        ];
      };
      fee_types: {
        Row: {
          category: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          academic_year_id: string | null;
          assignment_id: string | null;
          category_id: string | null;
          class_id: string | null;
          component_type: string | null;
          created_at: string | null;
          feedback: string | null;
          graded_at: string | null;
          graded_by: string | null;
          id: string;
          points_earned: number | null;
          score: number | null;
          semester: string | null;
          student_id: string;
          subject_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          academic_year_id?: string | null;
          assignment_id?: string | null;
          category_id?: string | null;
          class_id?: string | null;
          component_type?: string | null;
          created_at?: string | null;
          feedback?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          points_earned?: number | null;
          score?: number | null;
          semester?: string | null;
          student_id: string;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          academic_year_id?: string | null;
          assignment_id?: string | null;
          category_id?: string | null;
          class_id?: string | null;
          component_type?: string | null;
          created_at?: string | null;
          feedback?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          points_earned?: number | null;
          score?: number | null;
          semester?: string | null;
          student_id?: string;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grades_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_graded_by_fkey";
            columns: ["graded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grades_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      import_errors: {
        Row: {
          created_at: string | null;
          error_message: string;
          error_type: string | null;
          field_name: string | null;
          id: string;
          import_log_id: string;
          row_data: Json | null;
          row_number: number;
          severity: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message: string;
          error_type?: string | null;
          field_name?: string | null;
          id?: string;
          import_log_id: string;
          row_data?: Json | null;
          row_number: number;
          severity?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string;
          error_type?: string | null;
          field_name?: string | null;
          id?: string;
          import_log_id?: string;
          row_data?: Json | null;
          row_number?: number;
          severity?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "import_errors_import_log_id_fkey";
            columns: ["import_log_id"];
            isOneToOne: false;
            referencedRelation: "import_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      import_logs: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          error_count: number;
          error_summary: string | null;
          file_name: string | null;
          file_size: number | null;
          id: string;
          import_type: string;
          imported_by: string;
          processed_rows: number;
          started_at: string | null;
          status: string;
          success_count: number;
          total_rows: number;
          warning_count: number;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          error_count?: number;
          error_summary?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          import_type: string;
          imported_by: string;
          processed_rows?: number;
          started_at?: string | null;
          status?: string;
          success_count?: number;
          total_rows?: number;
          warning_count?: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          error_count?: number;
          error_summary?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          import_type?: string;
          imported_by?: string;
          processed_rows?: number;
          started_at?: string | null;
          status?: string;
          success_count?: number;
          total_rows?: number;
          warning_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "import_logs_imported_by_fkey";
            columns: ["imported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          created_at: string;
          description: string;
          fee_type_id: string | null;
          id: string;
          invoice_id: string;
          quantity: number | null;
          total_price: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          fee_type_id?: string | null;
          id?: string;
          invoice_id: string;
          quantity?: number | null;
          total_price: number;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          fee_type_id?: string | null;
          id?: string;
          invoice_id?: string;
          quantity?: number | null;
          total_price?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_fee_type_id_fkey";
            columns: ["fee_type_id"];
            isOneToOne: false;
            referencedRelation: "fee_types";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_allocations: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          invoice_id: string;
          notes: string | null;
          payment_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          invoice_id: string;
          notes?: string | null;
          payment_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          invoice_id?: string;
          notes?: string | null;
          payment_id?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          requires_reference: boolean | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          requires_reference?: boolean | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          requires_reference?: boolean | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_schedule_installments: {
        Row: {
          created_at: string;
          description: string | null;
          due_date: string;
          id: string | null;
          installment_number: number;
          percentage: number;
          schedule_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          due_date: string;
          id?: string | null;
          installment_number: number;
          percentage: number;
          schedule_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          due_date?: string;
          id?: string | null;
          installment_number?: number;
          percentage?: number;
          schedule_id?: string;
        };
        Relationships: [];
      };
      permission_audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          ip_address: unknown;
          new_value: Json | null;
          old_value: Json | null;
          performed_by: string;
          permission_code: string;
          reason: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          new_value?: Json | null;
          old_value?: Json | null;
          performed_by: string;
          permission_code: string;
          reason?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          new_value?: Json | null;
          old_value?: Json | null;
          performed_by?: string;
          permission_code?: string;
          reason?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "permission_audit_logs_performer_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "permission_audit_logs_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      permission_definitions: {
        Row: {
          action: string;
          category: string | null;
          code: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_system: boolean | null;
          name: string;
          resource: string;
        };
        Insert: {
          action: string;
          category?: string | null;
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name: string;
          resource: string;
        };
        Update: {
          action?: string;
          category?: string | null;
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name?: string;
          resource?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          created_at: string | null;
          created_by: string | null;
          date_of_birth: string | null;
          department: string | null;
          email: string | null;
          emergency_contact: string | null;
          enrollment_date: string | null;
          first_name: string | null;
          full_name: string | null;
          gender: string | null;
          grade_level: string | null;
          id: string;
          is_active: boolean | null;
          last_name: string | null;
          notes: string | null;
          phone: string | null;
          photo_url: string | null;
          role: string | null;
          status: string | null;
          student_code: string | null;
          student_id: string | null;
          subject_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_of_birth?: string | null;
          department?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          enrollment_date?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          gender?: string | null;
          grade_level?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          role?: string | null;
          status?: string | null;
          student_code?: string | null;
          student_id?: string | null;
          subject_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_of_birth?: string | null;
          department?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          enrollment_date?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          gender?: string | null;
          grade_level?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          role?: string | null;
          status?: string | null;
          student_code?: string | null;
          student_id?: string | null;
          subject_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_codes: {
        Row: {
          class_id: string | null;
          created_at: string | null;
          id: string;
          token: string;
          used_at: string | null;
          valid_until: string;
        };
        Insert: {
          class_id?: string | null;
          created_at?: string | null;
          id?: string;
          token: string;
          used_at?: string | null;
          valid_until: string;
        };
        Update: {
          class_id?: string | null;
          created_at?: string | null;
          id?: string;
          token?: string;
          used_at?: string | null;
          valid_until?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_codes_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string | null;
          id: string;
          permission_code: string;
          role: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          permission_code: string;
          role: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          permission_code?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fkey";
            columns: ["permission_code"];
            isOneToOne: false;
            referencedRelation: "permission_definitions";
            referencedColumns: ["code"];
          },
        ];
      };
      school_settings: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          value: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Relationships: [];
      };
      semesters: {
        Row: {
          code: string;
          created_at: string | null;
          end_date: string;
          id: string;
          is_active: boolean | null;
          name: string;
          start_date: string;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          end_date: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          start_date: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          end_date?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          start_date?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      student_accounts: {
        Row: {
          academic_year_id: string;
          balance: number;
          created_at: string;
          id: string;
          notes: string | null;
          status: string;
          student_id: string;
          total_fees: number;
          total_paid: number;
          updated_at: string;
        };
        Insert: {
          academic_year_id: string;
          balance?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: string;
          student_id: string;
          total_fees?: number;
          total_paid?: number;
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          balance?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: string;
          student_id?: string;
          total_fees?: number;
          total_paid?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_accounts_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_accounts_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      student_conducts: {
        Row: {
          academic_year_id: string;
          comments: string | null;
          created_at: string | null;
          evaluated_at: string | null;
          evaluated_by: string | null;
          id: string;
          rating: string;
          student_id: string;
          term: string;
          updated_at: string | null;
        };
        Insert: {
          academic_year_id: string;
          comments?: string | null;
          created_at?: string | null;
          evaluated_at?: string | null;
          evaluated_by?: string | null;
          id?: string;
          rating: string;
          student_id: string;
          term: string;
          updated_at?: string | null;
        };
        Update: {
          academic_year_id?: string;
          comments?: string | null;
          created_at?: string | null;
          evaluated_at?: string | null;
          evaluated_by?: string | null;
          id?: string;
          rating?: string;
          student_id?: string;
          term?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_conducts_evaluator_fkey";
            columns: ["evaluated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_conducts_student_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_conducts_year_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
        ];
      };
      student_profiles: {
        Row: {
          created_at: string | null;
          enrollment_date: string | null;
          grade_level: string | null;
          id: string;
          notes: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          profile_id: string;
          student_code: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          enrollment_date?: string | null;
          grade_level?: string | null;
          id?: string;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          profile_id: string;
          student_code?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          enrollment_date?: string | null;
          grade_level?: string | null;
          id?: string;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          profile_id?: string;
          student_code?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_profiles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subject_group_subjects: {
        Row: {
          created_at: string | null;
          id: string;
          is_mandatory: boolean | null;
          subject_group_id: string;
          subject_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_mandatory?: boolean | null;
          subject_group_id: string;
          subject_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_mandatory?: boolean | null;
          subject_group_id?: string;
          subject_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subject_group_subjects_group_fkey";
            columns: ["subject_group_id"];
            isOneToOne: false;
            referencedRelation: "subject_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subject_group_subjects_subject_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      subject_groups: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          grade_level: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          grade_level?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          grade_level?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          code: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      teacher_profiles: {
        Row: {
          bio: string | null;
          created_at: string | null;
          department: string | null;
          hourly_rate: number | null;
          id: string;
          profile_id: string;
          specialization: string | null;
          teaching_subjects: string[] | null;
          teacher_type: string;
          updated_at: string | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string | null;
          department?: string | null;
          hourly_rate?: number | null;
          id?: string;
          profile_id: string;
          specialization?: string | null;
          teaching_subjects?: string[] | null;
          teacher_type?: string;
          updated_at?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string | null;
          department?: string | null;
          hourly_rate?: number | null;
          id?: string;
          profile_id?: string;
          specialization?: string | null;
          teaching_subjects?: string[] | null;
          teacher_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      timetable_slots: {
        Row: {
          class_id: string | null;
          created_at: string | null;
          day_of_week: number;
          end_time: string;
          id: string;
          notes: string | null;
          room: string | null;
          semester_id: string | null;
          start_time: string;
          subject_id: string | null;
          teacher_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          class_id?: string | null;
          created_at?: string | null;
          day_of_week: number;
          end_time: string;
          id?: string;
          notes?: string | null;
          room?: string | null;
          semester_id?: string | null;
          start_time: string;
          subject_id?: string | null;
          teacher_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          class_id?: string | null;
          created_at?: string | null;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          notes?: string | null;
          room?: string | null;
          semester_id?: string | null;
          start_time?: string;
          subject_id?: string | null;
          teacher_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_slots_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_slots_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tuition_config: {
        Row: {
          class_type: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          monthly_fee: number;
          sessions_per_week: number;
          updated_at: string | null;
        };
        Insert: {
          class_type: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          monthly_fee: number;
          sessions_per_week: number;
          updated_at?: string | null;
        };
        Update: {
          class_type?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          monthly_fee?: number;
          sessions_per_week?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auth_profile_id: { Args: never; Returns: string };
      auth_role: { Args: never; Returns: string };
      batch_insert_enrollments: {
        Args: {
          p_class_id: string;
          p_enrollment_date?: string;
          p_status?: string;
          p_student_ids: string[];
        };
        Returns: number;
      };
      calculate_average_grade: {
        Args: {
          p_class_id: string;
          p_semester?: string;
          p_student_id: string;
          p_subject_id: string;
        };
        Returns: number;
      };
      calculate_overall_grade: {
        Args: { p_class_id: string; p_student_id: string };
        Returns: number;
      };
      check_in_with_qr: {
        Args: { p_student_id: string; p_token: string };
        Returns: Json;
      };
      convert_student_code_to_vietnamese:
        | { Args: { old_code: string }; Returns: string }
        | {
          Args: { old_code: string; p_student_id?: string };
          Returns: string;
        };
      generate_qr_code:
        | {
          Args: { p_class_id: string; p_valid_minutes?: number };
          Returns: Json;
        }
        | {
          Args: {
            p_date: string;
            p_expiry_hours?: number;
            p_student_id: string;
          };
          Returns: {
            code: string;
            expires_at: string;
          }[];
        };
      get_class_attendance: {
        Args: { p_class_id: string; p_date: string };
        Returns: {
          checked_in_at: string;
          status: string;
          student_id: string;
          student_name: string;
        }[];
      };
      get_class_enrollment_count: {
        Args: { p_class_id: string };
        Returns: number;
      };
      get_class_tuition: { Args: { p_class_id: string }; Returns: number };
      get_current_profile_id: { Args: never; Returns: string };
      get_current_user_role: { Args: never; Returns: string };
      get_my_profile_id: { Args: never; Returns: string };
      get_my_role: { Args: never; Returns: string };
      get_student_enrollment_count: {
        Args: { p_student_id: string };
        Returns: number;
      };
      get_student_with_enrollments: {
        Args: { p_student_id: string };
        Returns: {
          address: string;
          class_id: string;
          class_name: string;
          created_at: string;
          date_of_birth: string;
          email: string;
          emergency_contact: string;
          enrollment_date: string;
          enrollment_id: string;
          enrollment_status: string;
          first_name: string;
          full_name: string;
          id: string;
          last_name: string;
          phone: string;
          role: string;
          updated_at: string;
        }[];
      };
      get_user_permissions: {
        Args: { p_user_id: string };
        Returns: {
          permission_code: string;
          source: string;
        }[];
      };
      get_user_statistics: { Args: never; Returns: Json };
      has_active_enrollments: {
        Args: { p_student_id: string };
        Returns: boolean;
      };
      is_admin: { Args: { user_id: string }; Returns: boolean };
      is_email_unique: {
        Args: { p_email: string; p_exclude_id?: string };
        Returns: boolean;
      };
      is_enrolled_in_class: {
        Args: { p_class_id: string; p_student_id: string };
        Returns: boolean;
      };
      is_student: { Args: { user_id: string }; Returns: boolean };
      is_teacher: { Args: { user_id: string }; Returns: boolean };
      record_exists: {
        Args: { record_id: string; table_name: string };
        Returns: boolean;
      };
      user_has_permission: {
        Args: { p_permission_code: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema =
  DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof (
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Tables"
      ]
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Views"
      ]
    )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? (
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Views"
    ]
  )[TableName] extends {
    Row: infer R;
  } ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (
    & DefaultSchema["Tables"]
    & DefaultSchema["Views"]
  ) ? (
      & DefaultSchema["Tables"]
      & DefaultSchema["Views"]
    )[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    } ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Insert: infer I;
  } ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    } ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Update: infer U;
  } ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    } ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]][
      "Enums"
    ]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][
    EnumName
  ]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof DatabaseWithoutInternals[
      PublicCompositeTypeNameOrOptions["schema"]
    ]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]][
    "CompositeTypes"
  ][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
