"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
async function authenticate(req, res, next) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('Missing JWT_SECRET. Set it in .env');
    }
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        (0, response_1.unauthorized)(res, 'Missing or invalid Authorization header');
        return;
    }
    const { data, error } = await supabase_1.supabase.auth.getUser(header.slice(7));
    if (error || !data.user) {
        (0, response_1.unauthorized)(res, 'Invalid or expired token');
        return;
    }
    req.user = {
        id: data.user.id,
        email: data.user.email ?? '',
        role: typeof data.user.user_metadata?.role === 'string' ? data.user.user_metadata.role : 'viewer',
    };
    next();
}
/**
 * Restrict access to listed roles.
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.unauthorized)(res, 'Authentication required');
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, response_1.forbidden)(res, 'Insufficient permissions');
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map