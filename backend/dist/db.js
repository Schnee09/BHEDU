"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCounts = exports.testConnection = void 0;
// src/db.ts
const supabase_1 = require("./config/supabase");
const testConnection = async () => {
    try {
        const { data, error } = await supabase_1.supabase.from('users').select('id').limit(1);
        if (error) {
            console.error('Supabase ping error:', error);
            return false;
        }
        return true;
    }
    catch (err) {
        console.error('testConnection error:', err);
        return false;
    }
};
exports.testConnection = testConnection;
const getCounts = async () => {
    try {
        const { count: users } = await supabase_1.supabase.from('users').select('id', { head: true, count: 'exact' });
        const { count: courses } = await supabase_1.supabase.from('courses').select('id', { head: true, count: 'exact' });
        const { count: lessons } = await supabase_1.supabase.from('lessons').select('id', { head: true, count: 'exact' });
        const { count: enrollments } = await supabase_1.supabase.from('enrollments').select('id', { head: true, count: 'exact' });
        return { users, courses, lessons, enrollments };
    }
    catch (err) {
        throw err;
    }
};
exports.getCounts = getCounts;
//# sourceMappingURL=db.js.map