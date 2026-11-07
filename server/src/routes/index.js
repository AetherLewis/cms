"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clients_1 = __importDefault(require("./clients"));
const contracts_1 = __importDefault(require("./contracts"));
const invoices_1 = __importDefault(require("./invoices"));
const payments_1 = __importDefault(require("./payments"));
const documents_1 = __importDefault(require("./documents"));
const audit_1 = __importDefault(require("./audit"));
const settings_1 = __importDefault(require("./settings"));
const recurring_1 = __importDefault(require("./recurring"));
const stats_1 = __importDefault(require("./stats"));
const router = (0, express_1.Router)();
router.use('/clients', clients_1.default);
router.use('/contracts', contracts_1.default);
router.use('/invoices', invoices_1.default);
router.use('/payments', payments_1.default);
router.use('/documents', documents_1.default);
router.use('/audit', audit_1.default);
router.use('/settings', settings_1.default);
router.use('/recurring', recurring_1.default);
router.use('/stats', stats_1.default);
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'StarCoreWeb' });
});
exports.default = router;
//# sourceMappingURL=index.js.map