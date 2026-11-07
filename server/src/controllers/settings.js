"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
async function getSettings(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            (0, response_1.notFound)(res, 'Settings not found');
            return;
        }
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function updateSettings(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const payload = {
            ...body,
            user_id: userId,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase_1.supabase
            .from('settings')
            .upsert(payload)
            .select()
            .single();
        if (error)
            throw error;
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=settings.js.map