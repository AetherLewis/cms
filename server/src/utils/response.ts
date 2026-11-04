import { Response } from 'express'

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export function sendJson<T>(
  res: Response,
  statusCode: number,
  body: ApiResponse<T>
): Response {
  return res.status(statusCode).json(body)
}

export function ok<T>(res: Response, data: T, message?: string): Response {
  return sendJson(res, 200, { success: true, message, data })
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return sendJson(res, 201, { success: true, message, data })
}

export function noContent(res: Response): Response {
  return res.status(204).end()
}

export function badRequest(res: Response, message: string, error?: string): Response {
  return sendJson(res, 400, { success: false, message, error })
}

export function unauthorized(res: Response, message = 'Unauthorized'): Response {
  return sendJson(res, 401, { success: false, message })
}

export function forbidden(res: Response, message = 'Forbidden'): Response {
  return sendJson(res, 403, { success: false, message })
}

export function notFound(res: Response, message = 'Not found'): Response {
  return sendJson(res, 404, { success: false, message })
}

export function serverError(res: Response, message = 'Internal server error'): Response {
  return sendJson(res, 500, { success: false, message })
}
