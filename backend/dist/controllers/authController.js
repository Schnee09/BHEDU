"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authService_1 = require("../services/authService");
exports.authController = {
    async register(req, res) {
        try {
            const { email, password, full_name, role } = req.body;
            if (!email || !password)
                return res.status(400).json({ error: 'email and password required' });
            const user = await authService_1.authService.register(email, password, full_name, role);
            return res.status(201).json({ user });
        }
        catch (err) {
            return res.status(400).json({ error: err.message ?? 'register failed' });
        }
    },
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ error: 'email and password required' });
            const data = await authService_1.authService.login(email, password);
            // data contains session + user (if successful)
            return res.json(data);
        }
        catch (err) {
            return res.status(401).json({ error: err.message ?? 'login failed' });
        }
    },
    // returns current user from token (requires requireAuth middleware or token handling)
    async profile(req, res) {
        try {
            const user = req.user;
            return res.json(user);
        }
        catch (err) {
            return res.status(500).json({ error: 'failed to get profile' });
        }
    }
};
//# sourceMappingURL=authController.js.map