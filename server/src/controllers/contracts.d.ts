import { AuthRequest } from '../middleware/auth';
/**
 * List contracts for the authenticated user.
 */
export declare function listContracts(req: AuthRequest, res: any): Promise<void>;
/**
 * Create a new contract.
 */
export declare function createContract(req: AuthRequest, res: any): Promise<void>;
/**
 * Get a single contract.
 */
export declare function getContract(req: AuthRequest, res: any): Promise<void>;
/**
 * Update a contract.
 */
export declare function updateContract(req: AuthRequest, res: any): Promise<void>;
/**
 * Delete a contract.
 */
export declare function deleteContract(req: AuthRequest, res: any): Promise<void>;
/**
 * Get dashboard stats for a contract (overdue invoices, etc.)
 */
export declare function getContractStats(req: AuthRequest, res: any): Promise<void>;
//# sourceMappingURL=contracts.d.ts.map