import { Response } from 'express';
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export declare function sendJson<T>(res: Response, statusCode: number, body: ApiResponse<T>): Response;
export declare function ok<T>(res: Response, data: T, message?: string): Response;
export declare function created<T>(res: Response, data: T, message?: string): Response;
export declare function noContent(res: Response): Response;
export declare function badRequest(res: Response, message: string, error?: string): Response;
export declare function unauthorized(res: Response, message?: string): Response;
export declare function forbidden(res: Response, message?: string): Response;
export declare function notFound(res: Response, message?: string): Response;
export declare function serverError(res: Response, message?: string): Response;
//# sourceMappingURL=response.d.ts.map