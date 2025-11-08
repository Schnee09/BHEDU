"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        const role = user?.user_metadata?.role;
        if (!role || !roles.includes(role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient role' });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=roleMiddleware.js.map