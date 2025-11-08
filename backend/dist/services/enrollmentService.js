"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentService = void 0;
// src/services/enrollmentService.ts
const supabase_1 = require("../config/supabase");
exports.enrollmentService = {
    async enroll(user_id, course_id) {
        const { data, error } = await supabase_1.supabase.from('enrollments')
            .upsert([{ user_id, course_id }], { onConflict: 'user_id,course_id' })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async unenroll(user_id, course_id) {
        const { error } = await supabase_1.supabase.from('enrollments')
            .delete()
            .match({ user_id, course_id });
        if (error)
            throw error;
        return true;
    },
    async getUserEnrollments(user_id) {
        const { data, error } = await supabase_1.supabase
            .from('enrollments')
            .select(`
        id,
        progress,
        status,
        enrolled_at,
        course_id,
        courses (
          id,
          title,
          description,
          thumbnail,
          author_id
        )
      `)
            .eq('user_id', user_id)
            .order('enrolled_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    async getCourseEnrollments(course_id) {
        const { data, error } = await supabase_1.supabase
            .from('enrollments')
            .select(`
        id,
        progress,
        status,
        enrolled_at,
        user_id,
        users (
          id,
          email,
          full_name,
          role
        )
      `)
            .eq('course_id', course_id)
            .order('enrolled_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    async updateProgress(user_id, course_id, progress) {
        const { data, error } = await supabase_1.supabase.from('enrollments')
            .update({ progress, updated_at: new Date().toISOString() })
            .match({ user_id, course_id })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async getEnrollmentById(id) {
        const { data, error } = await supabase_1.supabase.from('enrollments')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    },
    async getEnrollment(user_id, course_id) {
        const { data, error } = await supabase_1.supabase.from('enrollments')
            .select('*')
            .match({ user_id, course_id })
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
};
//# sourceMappingURL=enrollmentService.js.map