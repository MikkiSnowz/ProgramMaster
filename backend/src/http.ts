import type { ErrorRequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Throws a client error unless `cond` holds. */
export function need(cond: unknown, status: number, message: string): asserts cond {
  if (!cond) throw new HttpError(status, message);
}

export const ok = (res: Response, data: unknown = null, status = 200) => res.status(status).json({ success: true, data });

// Postgres classes 22 (bad data) and 23 (constraint violation) are caused by the request, not the server.
export const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.status ?? (/^2[23]/.test(err.code) ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, error: status >= 500 ? 'Server error' : err.message });
};
