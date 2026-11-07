"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const response_1 = require("../utils/response");
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    // In development, log the full stack
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }
    (0, response_1.serverError)(res, message);
}
//# sourceMappingURL=error.js.map