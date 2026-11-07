"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDocuments = listDocuments;
exports.createDocument = createDocument;
exports.getDocument = getDocument;
exports.deleteDocument = deleteDocument;
exports.exportDocument = exportDocument;
const response_1 = require("../utils/response");
const supabase_1 = require("../config/supabase");
async function listDocuments(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            (0, response_1.badRequest)(res, 'User ID missing');
            return;
        }
        const { data, error } = await supabase_1.supabase
            .from('documents')
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
async function createDocument(req, res) {
    try {
        const userId = req.user?.id;
        const body = req.body;
        if (!userId || !body?.title) {
            (0, response_1.badRequest)(res, 'Title is required');
            return;
        }
        const payload = {
            user_id: userId,
            title: body.title,
            file_url: body.fileUrl || body.file_url || null,
            document_type: body.documentType || body.document_type || 'other',
            description: body.description || null,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase_1.supabase.from('documents').insert(payload).select().single();
        if (error)
            throw error;
        (0, response_1.created)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function getDocument(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { data, error } = await supabase_1.supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error) {
            (0, response_1.notFound)(res, 'Document not found');
            return;
        }
        (0, response_1.ok)(res, data);
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
async function deleteDocument(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { error } = await supabase_1.supabase
            .from('documents')
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
async function exportDocument(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { data, error } = await supabase_1.supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            (0, response_1.notFound)(res, 'Document not found');
            return;
        }
        (0, response_1.ok)(res, { exported_at: new Date().toISOString(), document: data });
    }
    catch (e) {
        (0, response_1.serverError)(res, e.message);
    }
}
//# sourceMappingURL=documents.js.map