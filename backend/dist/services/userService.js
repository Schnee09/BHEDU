"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const supabase_1 = require("../config/supabase");
const sb = supabase_1.supabase;
exports.userService = {
    async getAll() {
        const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data;
    },
    async getById(id) {
        const { data, error } = await sb.from('users').select('*').eq('id', id).single();
        if (error)
            throw new Error(error.message);
        return data;
    },
    async create(profile) {
        const { data, error } = await sb.from('users').insert(profile).select().single();
        if (error)
            throw new Error(error.message);
        return data;
    },
    async update(id, updates) {
        const { data, error } = await sb
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    },
    async delete(id) {
        const { error } = await sb.from('users').delete().eq('id', id);
        if (error)
            throw new Error(error.message);
        return true;
    }
};
//# sourceMappingURL=userService.js.map