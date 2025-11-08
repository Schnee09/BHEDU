"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonService = void 0;
// src/services/lessonService.ts
const supabase_1 = require("../config/supabase");
exports.lessonService = {
    async createLesson(payload) {
        const { data, error } = await supabase_1.supabase.from('lessons')
            .insert([payload])
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    },
    async updateLesson(id, updates) {
        const { data, error } = await supabase_1.supabase.from('lessons')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    },
    async deleteLesson(id) {
        const { error } = await supabase_1.supabase.from('lessons').delete().eq('id', id);
        if (error)
            throw new Error(error.message);
        return true;
    },
    async getLessonsByCourse(course_id, onlyPublished = false) {
        let q = supabase_1.supabase.from('lessons').select('*').eq('course_id', course_id).order('order_index', { ascending: true });
        if (onlyPublished)
            q = q.eq('is_published', true);
        const { data, error } = await q;
        if (error)
            throw new Error(error.message);
        return data;
    },
    async getLessonById(id) {
        const { data, error } = await supabase_1.supabase
            .from('lessons')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    },
    async setPublish(id, is_published) {
        const { data, error } = await supabase_1.supabase.from('lessons')
            .update({ is_published, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
};
//# sourceMappingURL=lessonService.js.map