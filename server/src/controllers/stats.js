"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.getMonthlyReport = getMonthlyReport;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
async function getDashboardStats(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data: stats, error } = await supabase_1.supabase
            .from('dashboard_stats')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error || !stats) {
            (0, response_1.notFound)(res, 'Dashboard stats not found');
            return;
        }
        (0, response_1.ok)(res, stats);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function getMonthlyReport(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data: report, error } = await supabase_1.supabase
            .from('monthly_reports')
            .select('*')
            .eq('user_id', userId)
            .eq('month', req.query.month || '2026-10') // Default to current month
            .single();
        if (error || !report) {
            (0, response_1.notFound)(res, 'Monthly report not found');
            return;
        }
        (0, response_1.ok)(res, report);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=stats.js.map