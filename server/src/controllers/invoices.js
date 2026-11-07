"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInvoices = listInvoices;
exports.createInvoice = createInvoice;
exports.getInvoice = getInvoice;
exports.updateInvoice = updateInvoice;
exports.deleteInvoice = deleteInvoice;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
async function listInvoices(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('invoices')
            .select('*, clients!inner(name, email), contracts!inner(title)')
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
async function createInvoice(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId || !body?.invoiceNumber || !body?.clientId) {
            (0, response_1.badRequest)(res, 'invoiceNumber and clientId are required');
            return;
        }
        // Compute from items
        const items = body.items || [];
        const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
        const taxRate = body.taxRate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        const payload = {
            user_id: userId,
            client_id: body.clientId,
            contract_id: body.contractId || null,
            invoice_number: body.invoiceNumber,
            status: body.status || 'draft',
            subtotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total,
            due_date: body.dueDate || null,
            issued_date: body.issuedDate || new Date().toISOString().split('T')[0],
            paid_date: null,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase_1.supabase.from('invoices').insert(payload).select().single();
        if (error)
            throw error;
        // Insert items
        if (items.length > 0 && data?.id) {
            const itemRows = items.map((item) => ({
                invoice_id: data.id,
                description: item.description || '',
                quantity: item.quantity ?? 1,
                unit_price: item.unit_price ?? 0,
                total: (item.quantity ?? 1) * (item.unit_price ?? 0),
            }));
            await supabase_1.supabase.from('invoice_items').insert(itemRows);
        }
        (0, response_1.created)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function getInvoice(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { data, error } = await supabase_1.supabase
            .from('invoices')
            .select('*, clients!inner(name, email), contracts!inner(title)')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error) {
            (0, response_1.notFound)(res, 'Invoice not found');
            return;
        }
        const { data: itemsData } = await supabase_1.supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', id);
        (0, response_1.ok)(res, { ...data, items: itemsData || [] });
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function updateInvoice(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const body = req.body;
        const { data, error } = await supabase_1.supabase
            .from('invoices')
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
async function deleteInvoice(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { error } = await supabase_1.supabase
            .from('invoices')
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
//# sourceMappingURL=invoices.js.map