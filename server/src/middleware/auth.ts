import { NextFunction, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { unauthorized, forbidden } from '../utils/response'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string }
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET. Set it in .env')
  }

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    unauthorized(res, 'Missing or invalid Authorization header')
    return
  }

  const { data, error } = await supabase.auth.getUser(header.slice(7))
  if (error || !data.user) {
    unauthorized(res, 'Invalid or expired token')
    return
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? '',
    role: typeof data.user.user_metadata?.role === 'string' ? data.user.user_metadata.role : 'viewer',
  }
  next()
}

/**
 * Restrict access to listed roles.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res, 'Authentication required')
      return
    }
    if (!allowedRoles.includes(req.user.role)) {
      forbidden(res, 'Insufficient permissions')
      return
    }
    next()
  }
}
