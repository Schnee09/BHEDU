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
      payments: {
        Row: {
          id: string;
          student_id: string;
          invoice_id: string;
          payment_method_id: string;
          amount: number;
          reference_number: string;
          payment_date: string;
          received_by: string;
          notes: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          invoice_id: string;
          payment_method_id: string;
          amount: number;
          reference_number: string;
          payment_date: string;
          received_by: string;
          notes: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          invoice_id?: string;
          payment_method_id?: string;
          amount?: number;
          reference_number?: string;
          payment_date?: string;
          received_by?: string;
          notes?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      all_teachers: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          photo_url: string;
          department: string;
          teacher_type: string;
          specialization: string;
          teaching_subjects: any[];
          hourly_rate: number;
          bio: string;
          display_type: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          photo_url: string;
          department: string;
          teacher_type: string;
          specialization: string;
          teaching_subjects: any[];
          hourly_rate: number;
          bio: string;
          display_type: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          photo_url?: string;
          department?: string;
          teacher_type?: string;
          specialization?: string;
          teaching_subjects?: any[];
          hourly_rate?: number;
          bio?: string;
          display_type?: string;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          score: number;
          feedback: string;
          graded_at: string;
          graded_by: string;
          created_at: string;
          updated_at: string;
          points_earned: number;
          component_type: string;
          semester: string;
          academic_year_id: string;
          category_id: string;
          subject_id: string;
          class_id: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          score: number;
          feedback: string;
          graded_at: string;
          graded_by: string;
          created_at?: string;
          updated_at?: string;
          points_earned: number;
          component_type: string;
          semester: string;
          academic_year_id: string;
          category_id: string;
          subject_id: string;
          class_id: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          score?: number;
          feedback?: string;
          graded_at?: string;
          graded_by?: string;
          created_at?: string;
          updated_at?: string;
          points_earned?: number;
          component_type?: string;
          semester?: string;
          academic_year_id?: string;
          category_id?: string;
          subject_id?: string;
          class_id?: string;
        };
        Relationships: [];
      };
      class_statistics: {
        Row: {
          class_id: string;
          class_name: string;
          total_students: any;
          total_attendance_records: any;
          present_count: any;
          attendance_rate: number;
        };
        Insert: {
          class_id: string;
          class_name: string;
          total_students: any;
          total_attendance_records: any;
          present_count: any;
          attendance_rate: number;
        };
        Update: {
          class_id?: string;
          class_name?: string;
          total_students?: any;
          total_attendance_records?: any;
          present_count?: any;
          attendance_rate?: number;
        };
        Relationships: [];
      };
      parent_student_links: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string;
          status: string;
          requested_at: string;
          reviewed_at: string;
          reviewed_by: string;
          rejection_reason: string;
          can_view_grades: boolean;
          can_view_attendance: boolean;
          can_view_finance: boolean;
          can_view_schedule: boolean;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          student_id: string;
          relationship: string;
          status: string;
          requested_at: string;
          reviewed_at: string;
          reviewed_by: string;
          rejection_reason: string;
          can_view_grades: boolean;
          can_view_attendance: boolean;
          can_view_finance: boolean;
          can_view_schedule: boolean;
          notes: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          student_id?: string;
          relationship?: string;
          status?: string;
          requested_at?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          rejection_reason?: string;
          can_view_grades?: boolean;
          can_view_attendance?: boolean;
          can_view_finance?: boolean;
          can_view_schedule?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          class_id: string;
          category_id: string;
          title: string;
          description: string;
          due_date: string;
          max_points: number;
          teacher_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          category_id: string;
          title: string;
          description: string;
          due_date: string;
          max_points: number;
          teacher_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          category_id?: string;
          title?: string;
          description?: string;
          due_date?: string;
          max_points?: number;
          teacher_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: string;
          role: string;
          permission_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role: string;
          permission_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          permission_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      student_profiles: {
        Row: {
          id: string;
          profile_id: string;
          student_code: string;
          grade_level: string;
          enrollment_date: string;
          parent_name: string;
          parent_phone: string;
          notes: string;
          created_at: string;
          updated_at: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          student_code: string;
          grade_level: string;
          enrollment_date: string;
          parent_name: string;
          parent_phone: string;
          notes: string;
          created_at?: string;
          updated_at?: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          student_code?: string;
          grade_level?: string;
          enrollment_date?: string;
          parent_name?: string;
          parent_phone?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      timetable_slots: {
        Row: {
          id: string;
          class_id: string;
          subject_id: string;
          teacher_id: string;
          semester_id: string;
          day_of_week: any;
          start_time: string;
          end_time: string;
          room: string;
          notes: string;
          created_at: string;
          updated_at: string;
          student_id: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          subject_id: string;
          teacher_id: string;
          semester_id: string;
          day_of_week: any;
          start_time: string;
          end_time: string;
          room: string;
          notes: string;
          created_at?: string;
          updated_at?: string;
          student_id: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          subject_id?: string;
          teacher_id?: string;
          semester_id?: string;
          day_of_week?: any;
          start_time?: string;
          end_time?: string;
          room?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
          student_id?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string;
          created_at: string;
          updated_at: string;
          credits: any;
          is_active: boolean;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description: string;
          created_at?: string;
          updated_at?: string;
          credits: any;
          is_active: boolean;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          credits?: any;
          is_active?: boolean;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      evaluation_types: {
        Row: {
          id: string;
          name: string;
          code: string;
          weight: any;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          weight: any;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          weight?: any;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          description: string;
          requires_reference: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          type: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          requires_reference: boolean;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
          type: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          requires_reference?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          type?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          teacher_id: string;
          created_at: string;
          grade_level: string;
          academic_year_id: string;
          subject_group_id: string;
          max_capacity: any;
          sessions_per_week: any;
          class_type: string;
          course_id: string;
          status: string;
          room: string;
          schedule: string;
          capacity: any;
          updated_at: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          teacher_id: string;
          created_at?: string;
          grade_level: string;
          academic_year_id: string;
          subject_group_id: string;
          max_capacity: any;
          sessions_per_week: any;
          class_type: string;
          course_id: string;
          status: string;
          room: string;
          schedule: string;
          capacity: any;
          updated_at?: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          teacher_id?: string;
          created_at?: string;
          grade_level?: string;
          academic_year_id?: string;
          subject_group_id?: string;
          max_capacity?: any;
          sessions_per_week?: any;
          class_type?: string;
          course_id?: string;
          status?: string;
          room?: string;
          schedule?: string;
          capacity?: any;
          updated_at?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      assignment_categories: {
        Row: {
          id: string;
          name: string;
          weight: number;
          class_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          weight: number;
          class_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          weight?: number;
          class_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      school_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_schedules: {
        Row: {
          id: string;
          name: string;
          description: string;
          academic_year_id: string;
          schedule_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          academic_year_id: string;
          schedule_type: string;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          academic_year_id?: string;
          schedule_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          date_of_birth: string;
          phone: string;
          address: string;
          emergency_contact: string;
          role: string;
          created_at: string;
          updated_at: string;
          student_id: string;
          grade_level: string;
          gender: string;
          enrollment_date: string;
          status: string;
          photo_url: string;
          department: string;
          is_active: boolean;
          created_by: string;
          notes: string;
          student_code: string;
          subject_id: string;
          phone_verified: boolean;
          preferred_auth_method: string;
          account_status: string;
          status_changed_at: string;
          status_changed_by: string;
          status_note: string;
          is_managed: boolean;
          deleted_at: string;
          updated_by: string;
          personal_email: string;
          teacher_code: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          date_of_birth: string;
          phone: string;
          address: string;
          emergency_contact: string;
          role: string;
          created_at?: string;
          updated_at?: string;
          student_id: string;
          grade_level: string;
          gender: string;
          enrollment_date: string;
          status: string;
          photo_url: string;
          department: string;
          is_active: boolean;
          created_by: string;
          notes: string;
          student_code: string;
          subject_id: string;
          phone_verified: boolean;
          preferred_auth_method: string;
          account_status: string;
          status_changed_at: string;
          status_changed_by: string;
          status_note: string;
          is_managed: boolean;
          deleted_at: string;
          updated_by: string;
          personal_email: string;
          teacher_code: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          email?: string;
          date_of_birth?: string;
          phone?: string;
          address?: string;
          emergency_contact?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
          student_id?: string;
          grade_level?: string;
          gender?: string;
          enrollment_date?: string;
          status?: string;
          photo_url?: string;
          department?: string;
          is_active?: boolean;
          created_by?: string;
          notes?: string;
          student_code?: string;
          subject_id?: string;
          phone_verified?: boolean;
          preferred_auth_method?: string;
          account_status?: string;
          status_changed_at?: string;
          status_changed_by?: string;
          status_note?: string;
          is_managed?: boolean;
          deleted_at?: string;
          updated_by?: string;
          personal_email?: string;
          teacher_code?: string;
        };
        Relationships: [];
      };
      payment_allocations: {
        Row: {
          id: string;
          payment_id: string;
          invoice_id: string;
          amount: number;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          invoice_id: string;
          amount: number;
          notes: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          invoice_id?: string;
          amount?: number;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_notes: {
        Row: {
          id: string;
          slot_id: string;
          week_start_date: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          week_start_date: string;
          notes: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slot_id?: string;
          week_start_date?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          value_json: Json;
          description: string;
          category: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          value_json: Json;
          description: string;
          category: string;
          is_public: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          value_json?: Json;
          description?: string;
          category?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teacher_profiles: {
        Row: {
          id: string;
          profile_id: string;
          department: string;
          specialization: string;
          teaching_subjects: any[];
          hourly_rate: number;
          bio: string;
          created_at: string;
          updated_at: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
          teacher_type: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          department: string;
          specialization: string;
          teaching_subjects: any[];
          hourly_rate: number;
          bio: string;
          created_at?: string;
          updated_at?: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
          teacher_type: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          department?: string;
          specialization?: string;
          teaching_subjects?: any[];
          hourly_rate?: number;
          bio?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
          teacher_type?: string;
        };
        Relationships: [];
      };
      attendance_reports: {
        Row: {
          id: string;
          report_type: string;
          class_id: string;
          student_id: string;
          date_from: string;
          date_to: string;
          total_days: any;
          present_count: any;
          absent_count: any;
          late_count: any;
          excused_count: any;
          attendance_rate: number;
          report_data: Json;
          generated_at: string;
          generated_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_type: string;
          class_id: string;
          student_id: string;
          date_from: string;
          date_to: string;
          total_days: any;
          present_count: any;
          absent_count: any;
          late_count: any;
          excused_count: any;
          attendance_rate: number;
          report_data: Json;
          generated_at: string;
          generated_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_type?: string;
          class_id?: string;
          student_id?: string;
          date_from?: string;
          date_to?: string;
          total_days?: any;
          present_count?: any;
          absent_count?: any;
          late_count?: any;
          excused_count?: any;
          attendance_rate?: number;
          report_data?: Json;
          generated_at?: string;
          generated_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          fee_type_id: string;
          description: string;
          quantity: any;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          fee_type_id: string;
          description: string;
          quantity: any;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          fee_type_id?: string;
          description?: string;
          quantity?: any;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      grading_scales: {
        Row: {
          id: string;
          name: string;
          description: string;
          scale: Json;
          is_default: boolean;
          created_at: string;
          updated_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          scale: Json;
          is_default: boolean;
          created_at?: string;
          updated_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          scale?: Json;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
        Relationships: [];
      };
      user_invitations: {
        Row: {
          id: string;
          email: string;
          phone: string;
          role: string;
          token: string;
          expires_at: string;
          invited_by: string;
          used_at: string;
          used_by: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone: string;
          role: string;
          token: string;
          expires_at: string;
          invited_by: string;
          used_at: string;
          used_by: string;
          metadata: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          role?: string;
          token?: string;
          expires_at?: string;
          invited_by?: string;
          used_at?: string;
          used_by?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      import_errors: {
        Row: {
          id: string;
          import_log_id: string;
          row_number: any;
          field_name: string;
          error_type: string;
          error_message: string;
          row_data: Json;
          severity: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_log_id: string;
          row_number: any;
          field_name: string;
          error_type: string;
          error_message: string;
          row_data: Json;
          severity: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          import_log_id?: string;
          row_number?: any;
          field_name?: string;
          error_type?: string;
          error_message?: string;
          row_data?: Json;
          severity?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      semesters: {
        Row: {
          id: string;
          name: string;
          code: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      payment_schedule_installments: {
        Row: {
          id: string;
          schedule_id: string;
          installment_number: any;
          due_date: string;
          percentage: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          installment_number: any;
          due_date: string;
          percentage: number;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          installment_number?: any;
          due_date?: string;
          percentage?: number;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      teacher_workload: {
        Row: {
          teacher_id: string;
          full_name: string;
          classes_assigned: any;
          total_slots: any;
          total_hours_per_week: number;
        };
        Insert: {
          teacher_id: string;
          full_name: string;
          classes_assigned: any;
          total_slots: any;
          total_hours_per_week: number;
        };
        Update: {
          teacher_id?: string;
          full_name?: string;
          classes_assigned?: any;
          total_slots?: any;
          total_hours_per_week?: number;
        };
        Relationships: [];
      };
      fee_assignments: {
        Row: {
          id: string;
          academic_year_id: string;
          fee_type_id: string;
          class_id: string;
          amount: number;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academic_year_id: string;
          fee_type_id: string;
          class_id: string;
          amount: number;
          description: string;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          academic_year_id?: string;
          fee_type_id?: string;
          class_id?: string;
          amount?: number;
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          type: string;
          is_published: boolean;
          published_at: string;
          expires_at: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          type: string;
          is_published: boolean;
          published_at: string;
          expires_at: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          type?: string;
          is_published?: boolean;
          published_at?: string;
          expires_at?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_conducts: {
        Row: {
          id: string;
          student_id: string;
          academic_year_id: string;
          term: string;
          rating: string;
          comments: string;
          evaluated_by: string;
          evaluated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          academic_year_id: string;
          term: string;
          rating: string;
          comments: string;
          evaluated_by: string;
          evaluated_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          academic_year_id?: string;
          term?: string;
          rating?: string;
          comments?: string;
          evaluated_by?: string;
          evaluated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          student_id: string;
          student_account_id: string;
          academic_year_id: string;
          issue_date: string;
          due_date: string;
          total_amount: number;
          paid_amount: number;
          status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          student_id: string;
          student_account_id: string;
          academic_year_id: string;
          issue_date: string;
          due_date: string;
          total_amount: number;
          paid_amount: number;
          status: string;
          notes: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          student_id?: string;
          student_account_id?: string;
          academic_year_id?: string;
          issue_date?: string;
          due_date?: string;
          total_amount?: number;
          paid_amount?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      academic_years: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_notes: {
        Row: {
          id: string;
          student_id: string;
          content: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          content: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          content?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_documents: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          type: string;
          url: string;
          size: any;
          storage_path: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          type: string;
          url: string;
          size: any;
          storage_path: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          type?: string;
          url?: string;
          size?: any;
          storage_path?: string;
          uploaded_by?: string;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      tutors: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          photo_url: string;
          teacher_type: string;
          specialization: string;
          teaching_subjects: any[];
          hourly_rate: number;
          bio: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          photo_url: string;
          teacher_type: string;
          specialization: string;
          teaching_subjects: any[];
          hourly_rate: number;
          bio: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          photo_url?: string;
          teacher_type?: string;
          specialization?: string;
          teaching_subjects?: any[];
          hourly_rate?: number;
          bio?: string;
        };
        Relationships: [];
      };
      fee_types: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          category: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description: string;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
          category: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          category?: string;
        };
        Relationships: [];
      };
      student_performance_summary: {
        Row: {
          student_id: string;
          full_name: string;
          student_code: string;
          class_id: string;
          class_name: string;
          subjects_count: any;
          average_score: number;
        };
        Insert: {
          student_id: string;
          full_name: string;
          student_code: string;
          class_id: string;
          class_name: string;
          subjects_count: any;
          average_score: number;
        };
        Update: {
          student_id?: string;
          full_name?: string;
          student_code?: string;
          class_id?: string;
          class_name?: string;
          subjects_count?: any;
          average_score?: number;
        };
        Relationships: [];
      };
      teacher_subjects: {
        Row: {
          id: string;
          profile_id: string;
          subject_id: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          subject_id: string;
          is_primary: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          subject_id?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permission_audit_logs: {
        Row: {
          id: string;
          action: string;
          user_id: string;
          permission_code: string;
          performed_by: string;
          old_value: Json;
          new_value: Json;
          reason: string;
          ip_address: string;
          user_agent: string;
          created_at: string;
          scope: string;
        };
        Insert: {
          id?: string;
          action: string;
          user_id: string;
          permission_code: string;
          performed_by: string;
          old_value: Json;
          new_value: Json;
          reason: string;
          ip_address: string;
          user_agent: string;
          created_at?: string;
          scope: string;
        };
        Update: {
          id?: string;
          action?: string;
          user_id?: string;
          permission_code?: string;
          performed_by?: string;
          old_value?: Json;
          new_value?: Json;
          reason?: string;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
          scope?: string;
        };
        Relationships: [];
      };
      qr_codes: {
        Row: {
          id: string;
          class_id: string;
          token: string;
          valid_until: string;
          used_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          token: string;
          valid_until: string;
          used_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          token?: string;
          valid_until?: string;
          used_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      permission_definitions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string;
          resource: string;
          action: string;
          category: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description: string;
          resource: string;
          action: string;
          category: string;
          is_system: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string;
          resource?: string;
          action?: string;
          category?: string;
          is_system?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          date: string;
          status: string;
          remarks: string;
          marked_by: string;
          created_at: string;
          timetable_slot_id: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          date: string;
          status: string;
          remarks: string;
          marked_by: string;
          created_at?: string;
          timetable_slot_id: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          date?: string;
          status?: string;
          remarks?: string;
          marked_by?: string;
          created_at?: string;
          timetable_slot_id?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_permissions: {
        Row: {
          id: string;
          user_id: string;
          permission_code: string;
          granted_by: string;
          granted_at: string;
          expires_at: string;
          is_denied: boolean;
          notes: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          permission_code: string;
          granted_by: string;
          granted_at: string;
          expires_at: string;
          is_denied: boolean;
          notes: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          permission_code?: string;
          granted_by?: string;
          granted_at?: string;
          expires_at?: string;
          is_denied?: boolean;
          notes?: string;
        };
        Relationships: [];
      };
      student_accounts: {
        Row: {
          id: string;
          student_id: string;
          academic_year_id: string;
          balance: number;
          total_fees: number;
          total_paid: number;
          notes: string;
          created_at: string;
          updated_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          academic_year_id: string;
          balance: number;
          total_fees: number;
          total_paid: number;
          notes: string;
          created_at?: string;
          updated_at?: string;
          status: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          academic_year_id?: string;
          balance?: number;
          total_fees?: number;
          total_paid?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          enrollment_date: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
          updated_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          enrollment_date: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
          updated_at?: string;
          status: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          enrollment_date?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
          updated_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      import_logs: {
        Row: {
          id: string;
          imported_by: string;
          import_type: string;
          file_name: string;
          file_size: any;
          total_rows: any;
          processed_rows: any;
          success_count: any;
          error_count: any;
          warning_count: any;
          status: string;
          error_summary: string;
          started_at: string;
          completed_at: string;
          duration_seconds: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          imported_by: string;
          import_type: string;
          file_name: string;
          file_size: any;
          total_rows: any;
          processed_rows: any;
          success_count: any;
          error_count: any;
          warning_count: any;
          status: string;
          error_summary: string;
          started_at: string;
          completed_at: string;
          duration_seconds: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          imported_by?: string;
          import_type?: string;
          file_name?: string;
          file_size?: any;
          total_rows?: any;
          processed_rows?: any;
          success_count?: any;
          error_count?: any;
          warning_count?: any;
          status?: string;
          error_summary?: string;
          started_at?: string;
          completed_at?: string;
          duration_seconds?: any;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          title: string;
          description: string;
          event_type: string;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          is_all_day: boolean;
          semester_id: string;
          class_id: string;
          color: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          event_type: string;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          is_all_day: boolean;
          semester_id: string;
          class_id: string;
          color: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          event_type?: string;
          start_date?: string;
          end_date?: string;
          start_time?: string;
          end_time?: string;
          is_all_day?: boolean;
          semester_id?: string;
          class_id?: string;
          color?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tuition_config: {
        Row: {
          id: string;
          class_type: string;
          sessions_per_week: any;
          monthly_fee: number;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_type: string;
          sessions_per_week: any;
          monthly_fee: number;
          description: string;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_type?: string;
          sessions_per_week?: any;
          monthly_fee?: number;
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permission_overrides: {
        Row: {
          id: string;
          role: string;
          permission_code: string;
          is_denied: boolean;
          granted_by: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role: string;
          permission_code: string;
          is_denied: boolean;
          granted_by: string;
          notes: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          permission_code?: string;
          is_denied?: boolean;
          granted_by?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          user_email: string;
          action: string;
          resource_type: string;
          resource_id: string;
          created_at: string;
          old_data: Json;
          new_data: Json;
          ip_address: string;
          user_agent: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email: string;
          action: string;
          resource_type: string;
          resource_id: string;
          created_at?: string;
          old_data: Json;
          new_data: Json;
          ip_address: string;
          user_agent: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          created_at?: string;
          old_data?: Json;
          new_data?: Json;
          ip_address?: string;
          user_agent?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          code: string;
          name: string;
          name_vi: string;
          description: string;
          subject_id: string;
          grade_level: any;
          credits: any;
          hours_per_week: any;
          is_required: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          semester: any;
          academic_year_id: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          name_vi: string;
          description: string;
          subject_id: string;
          grade_level: any;
          credits: any;
          hours_per_week: any;
          is_required: boolean;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
          semester: any;
          academic_year_id: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          name_vi?: string;
          description?: string;
          subject_id?: string;
          grade_level?: any;
          credits?: any;
          hours_per_week?: any;
          is_required?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          semester?: any;
          academic_year_id?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_active_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          date_of_birth: string;
          phone: string;
          address: string;
          emergency_contact: string;
          role: string;
          created_at: string;
          updated_at: string;
          student_id: string;
          grade_level: string;
          gender: string;
          enrollment_date: string;
          status: string;
          photo_url: string;
          department: string;
          is_active: boolean;
          created_by: string;
          notes: string;
          student_code: string;
          subject_id: string;
          phone_verified: boolean;
          preferred_auth_method: string;
          account_status: string;
          status_changed_at: string;
          status_changed_by: string;
          status_note: string;
          is_managed: boolean;
          deleted_at: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          email?: string;
          date_of_birth?: string;
          phone?: string;
          address?: string;
          emergency_contact?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
          student_id?: string;
          grade_level?: string;
          gender?: string;
          enrollment_date?: string;
          status?: string;
          photo_url?: string;
          department?: string;
          is_active?: boolean;
          created_by?: string;
          notes?: string;
          student_code?: string;
          subject_id?: string;
          phone_verified?: boolean;
          preferred_auth_method?: string;
          account_status?: string;
          status_changed_at?: string;
          status_changed_by?: string;
          status_note?: string;
          is_managed?: boolean;
          deleted_at?: string;
          updated_by?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          email?: string;
          date_of_birth?: string;
          phone?: string;
          address?: string;
          emergency_contact?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
          student_id?: string;
          grade_level?: string;
          gender?: string;
          enrollment_date?: string;
          status?: string;
          photo_url?: string;
          department?: string;
          is_active?: boolean;
          created_by?: string;
          notes?: string;
          student_code?: string;
          subject_id?: string;
          phone_verified?: boolean;
          preferred_auth_method?: string;
          account_status?: string;
          status_changed_at?: string;
          status_changed_by?: string;
          status_note?: string;
          is_managed?: boolean;
          deleted_at?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      v_teacher_subjects: {
        Row: {
          profile_id: string;
          full_name: string;
          email: string;
          subject_id: string;
          subject_name: string;
          subject_code: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          profile_id?: string;
          full_name?: string;
          email?: string;
          subject_id?: string;
          subject_name?: string;
          subject_code?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          full_name?: string;
          email?: string;
          subject_id?: string;
          subject_name?: string;
          subject_code?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      v_active_classes: {
        Row: {
          id: string;
          name: string;
          teacher_id: string;
          created_at: string;
          grade_level: string;
          academic_year_id: string;
          subject_group_id: string;
          max_capacity: any;
          sessions_per_week: any;
          class_type: string;
          course_id: string;
          status: string;
          room: string;
          schedule: string;
          capacity: any;
          updated_at: string;
          deleted_at: string;
          created_by: string;
          updated_by: string;
          course_name: string;
          teacher_name: string;
        };
        Insert: {
          id?: string;
          name?: string;
          teacher_id?: string;
          created_at?: string;
          grade_level?: string;
          academic_year_id?: string;
          subject_group_id?: string;
          max_capacity?: any;
          sessions_per_week?: any;
          class_type?: string;
          course_id?: string;
          status?: string;
          room?: string;
          schedule?: string;
          capacity?: any;
          updated_at?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
          course_name?: string;
          teacher_name?: string;
        };
        Update: {
          id?: string;
          name?: string;
          teacher_id?: string;
          created_at?: string;
          grade_level?: string;
          academic_year_id?: string;
          subject_group_id?: string;
          max_capacity?: any;
          sessions_per_week?: any;
          class_type?: string;
          course_id?: string;
          status?: string;
          room?: string;
          schedule?: string;
          capacity?: any;
          updated_at?: string;
          deleted_at?: string;
          created_by?: string;
          updated_by?: string;
          course_name?: string;
          teacher_name?: string;
        };
        Relationships: [];
      };
      v_active_students: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          date_of_birth: string;
          phone: string;
          address: string;
          emergency_contact: string;
          role: string;
          created_at: string;
          updated_at: string;
          student_id: string;
          grade_level: string;
          gender: string;
          enrollment_date: string;
          status: string;
          photo_url: string;
          department: string;
          is_active: boolean;
          created_by: string;
          notes: string;
          student_code: string;
          subject_id: string;
          phone_verified: boolean;
          preferred_auth_method: string;
          account_status: string;
          status_changed_at: string;
          status_changed_by: string;
          status_note: string;
          is_managed: boolean;
          deleted_at: string;
          updated_by: string;
          sp_student_code: string;
          sp_grade_level: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          email?: string;
          date_of_birth?: string;
          phone?: string;
          address?: string;
          emergency_contact?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
          student_id?: string;
          grade_level?: string;
          gender?: string;
          enrollment_date?: string;
          status?: string;
          photo_url?: string;
          department?: string;
          is_active?: boolean;
          created_by?: string;
          notes?: string;
          student_code?: string;
          subject_id?: string;
          phone_verified?: boolean;
          preferred_auth_method?: string;
          account_status?: string;
          status_changed_at?: string;
          status_changed_by?: string;
          status_note?: string;
          is_managed?: boolean;
          deleted_at?: string;
          updated_by?: string;
          sp_student_code?: string;
          sp_grade_level?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          email?: string;
          date_of_birth?: string;
          phone?: string;
          address?: string;
          emergency_contact?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
          student_id?: string;
          grade_level?: string;
          gender?: string;
          enrollment_date?: string;
          status?: string;
          photo_url?: string;
          department?: string;
          is_active?: boolean;
          created_by?: string;
          notes?: string;
          student_code?: string;
          subject_id?: string;
          phone_verified?: boolean;
          preferred_auth_method?: string;
          account_status?: string;
          status_changed_at?: string;
          status_changed_by?: string;
          status_note?: string;
          is_managed?: boolean;
          deleted_at?: string;
          updated_by?: string;
          sp_student_code?: string;
          sp_grade_level?: string;
        };
        Relationships: [];
      };
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
