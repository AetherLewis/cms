"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPayments = listPayments;
exports.createPayment = createPayment;
exports.getPayment = getPayment;
exports.deletePayment = deletePayment;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
async function listPayments(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('payments')
            .select('*, invoices!inner(invoice_number, total, status, clients!inner(name))')
            .eq('invoices.user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function createPayment(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId || !body?.invoiceId || !body?.amount) {
            (0, response_1.badRequest)(res, 'invoiceId and amount are required');
            return;
        }
        // Verify invoice belongs to user
        const { data: inv } = await supabase_1.supabase
            .from('invoices')
            .select('total')
            .eq('id', body.invoiceId)
            .eq('user_id', userId)
            .single();
        if (!inv) {
            (0, response_1.badRequest)(res, 'Invoice not found or does not belong to user');
            return;
        }
        const payload = {
            invoice_id: body.invoiceId,
            amount: body.amount,
            payment_date: body.paymentDate || new Date().toISOString().split('T')[0],
            payment_method: (body.paymentMethod || 'bank_transfer'),
            reference: body.reference || null,
            notes: body.notes || null,
        };
        const { data, error } = await supabase_1.supabase.from('payments').insert(payload).select().single();
        if (error)
            throw error;
        // If this fully covers the invoice, update status
        const { data: allPayments } = await supabase_1.supabase
            .from('payments')
            .select('amount')
            .eq('invoice_id', body.invoiceId);
        const totalPaid = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        if (totalPaid >= inv.total) {
            await supabase_1.supabase
                .from('invoices')
                .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
                .eq('id', body.invoiceId);
        }
        (0, response_1.created)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function getPayment(req, res) {
    try {
        const { id } = req.params;
        const { data, error } = await supabase_1.supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            (0, response_1.badRequest)(res, 'Payment not found');
            return;
        }
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function deletePayment(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabase.from('payments').delete().eq('id', id);
        if (error)
            throw error;
        (0, response_1.noContent)(res);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=payments.js.map