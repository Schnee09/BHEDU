"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const supabase_1 = require("../config/supabase");
const requireAuth = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(401).json({ error: 'Missing Authorization header' });
    const token = auth.replace('Bearer ', '').trim();
    if (!token)
        return res.status(401).json({ error: 'Missing token' });
    try {
        const { data, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !data.user)
            return res.status(401).json({ error: 'Invalid token' });
        req.user = data.user; // attaches supabase user object
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=authMiddleware.js.map