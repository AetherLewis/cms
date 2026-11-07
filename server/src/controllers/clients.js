"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listClients = listClients;
exports.createClient = createClient;
exports.getClient = getClient;
exports.updateClient = updateClient;
exports.deleteClient = deleteClient;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
/**
 * List clients for the authenticated user.
 */
async function listClients(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('clients')
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
/**
 * Create a new client.
 */
async function createClient(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId || !body?.name || !body?.email) {
            (0, response_1.badRequest)(res, 'Name and email are required');
            return;
        }
        const payload = {
            user_id: userId,
            name: body.name,
            email: body.email,
            phone: body.phone || null,
            address: body.address || null,
            company: body.company || null,
            tax_id: body.tax_id || null,
            status: body.status || 'active',
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase_1.supabase.from('clients').insert(payload).select().single();
        if (error)
            throw error;
        (0, response_1.created)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
/**
 * Get a single client.
 */
async function getClient(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { data, error } = await supabase_1.supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error) {
            (0, response_1.notFound)(res, 'Client not found');
            return;
        }
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
/**
 * Update a client.
 */
async function updateClient(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const body = req.body;
        const { data, error } = await supabase_1.supabase
            .from('clients')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
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
/**
 * Delete a client.
 */
async function deleteClient(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { error } = await supabase_1.supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        (0, response_1.noContent)(res);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=clients.js.map