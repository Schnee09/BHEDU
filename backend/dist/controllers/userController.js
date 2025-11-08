"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const userService_1 = require("../services/userService");
exports.userController = {
    async list(req, res) {
        try {
            const users = await userService_1.userService.getAll();
            res.json(users);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async get(req, res) {
        try {
            const id = req.params.id;
            const user = await userService_1.userService.getById(id);
            res.json(user);
        }
        catch (err) {
            res.status(404).json({ error: err.message });
        }
    },
    async me(req, res) {
        try {
            const user = req.user;
            const data = await userService_1.userService.getById(user.id);
            res.json(data);
        }
        catch (err) {
            res.status(404).json({ error: err.message });
        }
    },
    async update(req, res) {
        try {
            const id = req.params.id;
            const user = req.user;
            // chỉ cho phép user tự update nếu không phải admin/teacher
            if (user.id !== id && !['admin', 'teacher'].includes(user.user_metadata?.role))
                return res.status(403).json({ error: 'Permission denied' });
            const data = await userService_1.userService.update(id, req.body);
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
            if (!['admin'].includes(user.user_metadata?.role))
                return res.status(403).json({ error: 'Only admin can delete users' });
            await userService_1.userService.delete(id);
            res.json({ success: true });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
};
//# sourceMappingURL=userController.js.map