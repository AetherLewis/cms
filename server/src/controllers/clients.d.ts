import { AuthRequest } from '../middleware/auth';
/**
 * List clients for the authenticated user.
 */
export declare function listClients(req: AuthRequest, res: any): Promise<void>;
/**
 * Create a new client.
 */
export declare function createClient(req: AuthRequest, res: any): Promise<void>;
/**
 * Get a single client.
 */
export declare function getClient(req: AuthRequest, res: any): Promise<void>;
/**
 * Update a client.
 */
export declare function updateClient(req: AuthRequest, res: any): Promise<void>;
/**
 * Delete a client.
 */
export declare function deleteClient(req: AuthRequest, res: any): Promise<void>;
//# sourceMappingURL=clients.d.ts.map