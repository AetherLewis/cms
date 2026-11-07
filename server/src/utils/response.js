"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendJson = sendJson;
exports.ok = ok;
exports.created = created;
exports.noContent = noContent;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.serverError = serverError;
function sendJson(res, statusCode, body) {
    return res.status(statusCode).json(body);
}
function ok(res, data, message) {
    return sendJson(res, 200, { success: true, message, data });
}
function created(res, data, message) {
    return sendJson(res, 201, { success: true, message, data });
}
function noContent(res) {
    return res.status(204).end();
}
function badRequest(res, message, error) {
    return sendJson(res, 400, { success: false, message, error });
}
function unauthorized(res, message = 'Unauthorized') {
    return sendJson(res, 401, { success: false, message });
}
function forbidden(res, message = 'Forbidden') {
    return sendJson(res, 403, { success: false, message });
}
function notFound(res, message = 'Not found') {
    return sendJson(res, 404, { success: false, message });
}
function serverError(res, message = 'Internal server error') {
    return sendJson(res, 500, { success: false, message });
}
//# sourceMappingURL=response.js.map