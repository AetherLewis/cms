"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRecurring = listRecurring;
exports.createRecurring = createRecurring;
exports.toggleRecurring = toggleRecurring;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
async function listRecurring(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('recurring')
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
async function createRecurring(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId || !body?.name) {
            (0, response_1.badRequest)(res, 'Name is required');
            return;
        }
        const payload = {
            user_id: userId,
            name: body.name,
            frequency: body.frequency || 'daily',
            start_date: body.startDate || new Date().toISOString().split('T')[0],
            end_date: body.endDate || null,
            active: body.active !== false,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase_1.supabase.from('recurring').insert(payload).select().single();
        if (error)
            throw error;
        (0, response_1.created)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function toggleRecurring(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { active } = req.body;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { error } = await supabase_1.supabase
            .from('recurring')
            .update({ active: !active, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        (0, response_1.ok)(res, { active: !active });
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=recurring.js.map