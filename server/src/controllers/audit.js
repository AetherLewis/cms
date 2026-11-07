"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = listAuditLogs;
exports.createAuditLog = createAuditLog;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
async function listAuditLogs(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function createAuditLog(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId || !body?.action) {
            (0, response_1.badRequest)(res, 'Action is required');
            return;
        }
        const payload = {
            user_id: userId,
            action: body.action,
            resource_type: body.resourceType || body.resource_type || null,
            resource_id: body.resourceId || body.resource_id || null,
            details: body.details || null,
            created_at: new Date().toISOString(),
        };
        const { data, error } = await supabase_1.supabase.from('audit_logs').insert(payload).select().single();
        if (error)
            throw error;
        (0, response_1.created)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=audit.js.map