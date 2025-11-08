"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseController = void 0;
const courseService_1 = require("../services/courseService");
exports.courseController = {
    async list(req, res) {
        try {
            const data = await courseService_1.courseService.getAll();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    // Public listing (no auth) - temporary for smoke tests only
    async listPublic(req, res) {
        try {
            const data = await courseService_1.courseService.getAll();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async get(req, res) {
        try {
            const id = req.params.id;
            const data = await courseService_1.courseService.getById(id);
            res.json(data);
        }
        catch (err) {
            res.status(404).json({ error: err.message });
        }
    },
    async create(req, res) {
        try {
            const user = req.user;
            const body = { ...req.body, author_id: user.id };
            const data = await courseService_1.courseService.create(body);
            res.json(data);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    },
    async update(req, res) {
        try {
            const id = req.params.id;
            const user = req.user;
            const existing = await courseService_1.courseService.getById(id);
            if (existing.author_id !== user.id && user.user_metadata?.role !== 'admin')
                return res.status(403).json({ error: 'Permission denied' });
            const data = await courseService_1.courseService.update(id, req.body);
            res.json(data);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    },
    async delete(req, res) {
        try {
            const id = req.params.id;
            const user = req.user;
            const existing = await courseService_1.courseService.getById(id);
            if (existing.author_id !== user.id && user.user_metadata?.role !== 'admin')
                return res.status(403).json({ error: 'Permission denied' });
            await courseService_1.courseService.delete(id);
            res.json({ success: true });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
};
//# sourceMappingURL=courseController.js.map