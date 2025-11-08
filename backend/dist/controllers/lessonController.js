"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonController = void 0;
const lessonService_1 = require("../services/lessonService");
const supabase_1 = require("../config/supabase");
// helper: actor from middleware requireAuth
const getActor = (req) => req.user;
const isTeacherOrAdmin = (actor) => !!actor && (actor.user_metadata?.role === 'teacher' || actor.user_metadata?.role === 'admin');
exports.lessonController = {
    // List lessons for a course.
    // - teacher/admin: return all lessons (published or not) if author or teacher/admin
    // - student: return only published lessons if enrolled in course
    async listByCourse(req, res) {
        try {
            const actor = getActor(req);
            const course_id = req.params.course_id;
            if (!course_id)
                return res.status(400).json({ error: 'course_id required' });
            // If teacher/admin, allow querying full list if they are author or have role
            if (isTeacherOrAdmin(actor)) {
                // further check if actor is course author or admin/teacher (we allow teachers generally)
                const lessons = await lessonService_1.lessonService.getLessonsByCourse(course_id, false);
                return res.json(lessons);
            }
            // Student: ensure enrolled
            const { data: enrollData, error: enrollErr } = await supabase_1.supabase
                .from('enrollments')
                .select('*')
                .match({ course_id, user_id: actor.id })
                .maybeSingle();
            if (enrollErr)
                throw enrollErr;
            if (!enrollData)
                return res.status(403).json({ error: 'Not enrolled in course' });
            // Only published lessons
            const lessons = await lessonService_1.lessonService.getLessonsByCourse(course_id, true);
            return res.json(lessons);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // Get single lesson by id.
    // - If published => allow if user (student) or teacher.
    // - If unpublished => only teacher/admin or course author can view.
    async getById(req, res) {
        try {
            const actor = getActor(req);
            const id = req.params.id;
            if (!id)
                return res.status(400).json({ error: 'id required' });
            const lesson = await lessonService_1.lessonService.getLessonById(id);
            if (!lesson)
                return res.status(404).json({ error: 'Lesson not found' });
            if (lesson.is_published)
                return res.json(lesson);
            // unpublished: allow only teacher/admin or course author
            if (isTeacherOrAdmin(actor)) {
                // teachers/admin allowed
                return res.json(lesson);
            }
            // check enrollment + course author check
            const { data: courseData, error: courseErr } = await supabase_1.supabase
                .from('courses')
                .select('*')
                .eq('id', lesson.course_id)
                .maybeSingle();
            if (courseErr)
                throw courseErr;
            // Normalize to any to avoid strict typing mismatch during migration
            const _courseData = courseData;
            // if requester is course author (rare for students), allow
            if (_courseData?.author_id === actor.id)
                return res.json(lesson);
            // else check enrollment
            const { data: enrollData, error: enrollErr } = await supabase_1.supabase
                .from('enrollments')
                .select('*')
                .match({ course_id: lesson.course_id, user_id: actor.id })
                .maybeSingle();
            if (enrollErr)
                throw enrollErr;
            if (!enrollData)
                return res.status(403).json({ error: 'Forbidden' });
            // If enrolled but lesson unpublished, still deny (teacher decides). Adjust if you want enrolled students to see drafts.
            return res.status(403).json({ error: 'Lesson not published' });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // Create lesson (teacher/admin or course author)
    async create(req, res) {
        try {
            const actor = getActor(req);
            if (!isTeacherOrAdmin(actor))
                return res.status(403).json({ error: 'Only teachers/admins can create lessons' });
            const { course_id, title, content, video_url, order_index } = req.body;
            if (!course_id || !title)
                return res.status(400).json({ error: 'course_id and title required' });
            // Optional: verify actor is author of course or admin
            const { data: courseData, error: courseErr } = await supabase_1.supabase
                .from('courses')
                .select('*')
                .eq('id', course_id)
                .maybeSingle();
            if (courseErr)
                throw courseErr;
            const _courseData2 = courseData;
            if (!courseData)
                return res.status(404).json({ error: 'Course not found' });
            if (_courseData2.author_id !== actor.id && actor.user_metadata?.role !== 'admin')
                return res.status(403).json({ error: 'Not course author' });
            const newLesson = await lessonService_1.lessonService.createLesson({
                course_id,
                title,
                content,
                video_url,
                order_index
            });
            return res.status(201).json(newLesson);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // Update lesson
    async update(req, res) {
        try {
            const actor = getActor(req);
            if (!isTeacherOrAdmin(actor))
                return res.status(403).json({ error: 'Only teachers/admins can update lessons' });
            const id = req.params.id;
            const updates = req.body;
            // permission: check course author or admin
            const lesson = await lessonService_1.lessonService.getLessonById(id);
            if (!lesson)
                return res.status(404).json({ error: 'Lesson not found' });
            const { data: courseData } = await supabase_1.supabase.from('courses').select('*').eq('id', lesson.course_id).maybeSingle();
            const _courseData3 = courseData;
            if (_courseData3?.author_id !== actor.id && actor.user_metadata?.role !== 'admin')
                return res.status(403).json({ error: 'Not course author' });
            const updated = await lessonService_1.lessonService.updateLesson(id, updates);
            return res.json(updated);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // Delete lesson
    async delete(req, res) {
        try {
            const actor = getActor(req);
            if (!isTeacherOrAdmin(actor))
                return res.status(403).json({ error: 'Only teachers/admins can delete lessons' });
            const id = req.params.id;
            const lesson = await lessonService_1.lessonService.getLessonById(id);
            if (!lesson)
                return res.status(404).json({ error: 'Lesson not found' });
            const { data: courseData } = await supabase_1.supabase.from('courses').select('*').eq('id', lesson.course_id).maybeSingle();
            const _courseData4 = courseData;
            if (_courseData4?.author_id !== actor.id && actor.user_metadata?.role !== 'admin')
                return res.status(403).json({ error: 'Not course author' });
            await lessonService_1.lessonService.deleteLesson(id);
            return res.json({ success: true });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // Publish/unpublish lesson
    async setPublish(req, res) {
        try {
            const actor = getActor(req);
            if (!isTeacherOrAdmin(actor))
                return res.status(403).json({ error: 'Only teachers/admins can change publish status' });
            const id = req.params.id;
            const { is_published } = req.body;
            if (typeof is_published !== 'boolean')
                return res.status(400).json({ error: 'is_published boolean required' });
            const lesson = await lessonService_1.lessonService.getLessonById(id);
            if (!lesson)
                return res.status(404).json({ error: 'Lesson not found' });
            const { data: courseData } = await supabase_1.supabase.from('courses').select('*').eq('id', lesson.course_id).maybeSingle();
            const _courseData5 = courseData;
            if (_courseData5?.author_id !== actor.id && actor.user_metadata?.role !== 'admin')
                return res.status(403).json({ error: 'Not course author' });
            const updated = await lessonService_1.lessonService.setPublish(id, is_published);
            return res.json(updated);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
};
//# sourceMappingURL=lessonController.js.map