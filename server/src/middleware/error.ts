import { NextFunction, Request, Response } from 'express'
import { serverError } from '../utils/response'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.isOperational ? err.message : 'Internal server error'

  // In development, log the full stack
  if (process.env.NODE_ENV === 'development') {
    console.error(err)
  }

  serverError(res, message)
}
