"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContracts = listContracts;
exports.createContract = createContract;
exports.getContract = getContract;
exports.updateContract = updateContract;
exports.deleteContract = deleteContract;
exports.getContractStats = getContractStats;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
/**
 * List contracts for the authenticated user.
 */
async function listContracts(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('contracts')
            .select('*, clients!inner(name, email)')
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
 * Create a new contract.
 */
async function createContract(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId || !body?.title || !body?.clientId) {
            (0, response_1.badRequest)(res, 'Title and clientId are required');
            return;
        }
        const payload = {
            user_id: userId,
            client_id: body.clientId,
            title: body.title,
            description: body.description || null,
            contract_type: body.contractType || null,
            status: body.status || 'draft',
            start_date: body.startDate || null,
            end_date: body.endDate || null,
            value: body.value || null,
            currency: body.currency || 'USD',
            payment_terms: body.paymentTerms || null,
            file_url: body.fileUrl || null,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase_1.supabase.from('contracts').insert(payload).select().single();
        if (error)
            throw error;
        (0, response_1.created)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
/**
 * Get a single contract.
 */
async function getContract(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { data, error } = await supabase_1.supabase
            .from('contracts')
            .select('*, clients!inner(name, email)')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error) {
            (0, response_1.notFound)(res, 'Contract not found');
            return;
        }
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
/**
 * Update a contract.
 */
async function updateContract(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const body = req.body;
        const { data, error } = await supabase_1.supabase
            .from('contracts')
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
 * Delete a contract.
 */
async function deleteContract(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { error } = await supabase_1.supabase
            .from('contracts')
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
/**
 * Get dashboard stats for a contract (overdue invoices, etc.)
 */
async function getContractStats(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        // Get total invoices per contract
        const { data: invoiceStats, error } = await supabase_1.supabase
            .from('invoices')
            .select('*, contracts!inner(title)')
            .eq('contracts.user_id', userId);
        if (error)
            throw error;
        // Calculate stats
        let totalContractValue = 0;
        let totalInvoiced = 0;
        let totalPaid = 0;
        let overdueCount = 0;
        // We need to also check contracts table for value - but let's start with what we have
        // We'll compute from invoices
        // Count overdue (unpaid invoices past due_date)
        const today = new Date().toISOString();
        if (invoiceStats) {
            invoiceStats.forEach((inv) => {
                const total = inv.total || 0;
                if (inv.status !== 'paid') {
                    totalInvoiced += total;
                    if (inv.due_date && new Date(inv.due_date) < new Date(today)) {
                        overdueCount++;
                    }
                }
                if (inv.status === 'paid') {
                    totalPaid += total;
                }
                // Contract value comes from contracts table - let's fetch separately
            });
        }
        (0, response_1.ok)(res, {
            total_invoiced: totalInvoiced,
            total_paid: totalPaid,
            total_outstanding: totalInvoiced - totalPaid,
            overdue_count: overdueCount,
        });
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=contracts.js.map