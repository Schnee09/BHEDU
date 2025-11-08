"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseService = void 0;
const supabase_1 = require("../config/supabase");
exports.courseService = {
    /**
     * Create a new course (teacher dashboard).
     */
    // Controller expects `create`
    async create(course) {
        const { data, error } = await supabase_1.supabase.from('courses')
            .insert([course])
            .select()
            .single();
        if (error)
            throw new Error(`Failed to create course: ${error.message}`);
        return data;
    },
    /**
     * Update an existing course (teacher dashboard).
     */
    // Controller expects `update`
    async update(id, updates) {
        const { data, error } = await supabase_1.supabase.from('courses')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(`Failed to update course: ${error.message}`);
        return data;
    },
    /**
     * Delete a course (teacher dashboard).
     */
    // Controller expects `delete`
    async delete(id) {
        const { error } = await supabase_1.supabase.from('courses').delete().eq('id', id);
        if (error)
            throw new Error(`Failed to delete course: ${error.message}`);
        return true;
    },
    /**
     * Get a single course by ID (used in app or dashboard).
     */
    // Controller expects `getById`
    async getById(id) {
        const { data, error } = await supabase_1.supabase.from('courses').select('*').eq('id', id).single();
        if (error)
            throw new Error(`Failed to fetch course: ${error.message}`);
        return data;
    },
    /**
     * Get all published courses (for student app).
     */
    // Controller expects `getAll` for listing — return all courses (admins) by default
    async getAll() {
        const { data, error } = await supabase_1.supabase.from('courses').select('*').order('created_at', { ascending: false });
        if (error)
            throw new Error(`Failed to fetch courses: ${error.message}`);
        return data || [];
    },
    /**
     * Get all courses created by a specific teacher (dashboard use).
     */
    async getCoursesByAuthor(author_id) {
        const { data, error } = await supabase_1.supabase
            .from('courses')
            .select('*')
            .eq('author_id', author_id)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`Failed to fetch teacher's courses: ${error.message}`);
        return data || [];
    },
    /**
     * Publish or unpublish a course.
     */
    async setPublishStatus(id, is_published) {
        const { data, error } = await supabase_1.supabase.from('courses')
            .update({ is_published, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(`Failed to change publish status: ${error.message}`);
        return data;
    },
};
//# sourceMappingURL=courseService.js.map