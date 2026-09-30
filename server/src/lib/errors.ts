import type { ErrorRequestHandler } from 'express'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
  }
}

// Express uses the four-argument signature to recognize error middleware.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message, code: error.code, details: error.details })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server', code: 'INTERNAL_ERROR' })
}
