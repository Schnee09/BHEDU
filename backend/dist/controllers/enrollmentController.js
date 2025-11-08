"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentController = void 0;
const enrollmentService_1 = require("../services/enrollmentService");
// helper to get supabase user attached by requireAuth
const getActor = (req) => req.user;
const isTeacherOrAdmin = (actor) => {
    // supabase user metadata location: actor.user_metadata?.role
    return !!actor && (actor.user_metadata?.role === 'teacher' || actor.user_metadata?.role === 'admin');
};
exports.enrollmentController = {
    // Enroll a user into a course.
    // Teacher/admin can enroll any user; student can enroll themselves.
    async enroll(req, res) {
        try {
            const actor = getActor(req);
            const { user_id, course_id } = req.body;
            if (!user_id || !course_id)
                return res.status(400).json({ error: 'user_id and course_id required' });
            if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
                return res.status(403).json({ error: 'Only teachers/admins can enroll other users' });
            }
            const row = await enrollmentService_1.enrollmentService.enroll(user_id, course_id);
            return res.status(201).json(row);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // Unenroll
    async unenroll(req, res) {
        try {
            const actor = getActor(req);
            const { user_id, course_id } = req.body;
            if (!user_id || !course_id)
                return res.status(400).json({ error: 'user_id and course_id required' });
            if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
                return res.status(403).json({ error: 'Only teachers/admins can unenroll other users' });
            }
            await enrollmentService_1.enrollmentService.unenroll(user_id, course_id);
            return res.status(204).send();
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // Get all enrollments for a user (student sees own; teacher/admin can view any)
    async getUserEnrollments(req, res) {
        try {
            const actor = getActor(req);
            const user_id = req.params.user_id;
            if (!user_id)
                return res.status(400).json({ error: 'user_id required' });
            if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const data = await enrollmentService_1.enrollmentService.getUserEnrollments(user_id);
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // Get all users enrolled in a course (teacher/admin only)
    async getCourseEnrollments(req, res) {
        try {
            const actor = getActor(req);
            const course_id = req.params.course_id;
            if (!isTeacherOrAdmin(actor))
                return res.status(403).json({ error: 'Only teachers/admins can view course enrollments' });
            const data = await enrollmentService_1.enrollmentService.getCourseEnrollments(course_id);
            return res.json(data);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
    // Update progress (student can update own; teacher/admin any)
    async updateProgress(req, res) {
        try {
            const actor = getActor(req);
            const { user_id, course_id, progress } = req.body;
            if (!user_id || !course_id || progress == null)
                return res.status(400).json({ error: 'user_id, course_id, progress required' });
            if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const data = await enrollmentService_1.enrollmentService.updateProgress(user_id, course_id, Number(progress));
            return res.json(data);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
};
//# sourceMappingURL=enrollmentController.js.map