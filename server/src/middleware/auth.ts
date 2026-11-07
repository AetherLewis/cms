import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { unauthorized, forbidden } from '../utils/response'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string }
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET. Set it in .env')
  }

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    unauthorized(res, 'Missing or invalid Authorization header')
    return
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      id: string
      email: string
      role: string
    }
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role }
    next()
  } catch {
    unauthorized(res, 'Invalid or expired token')
  }
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
