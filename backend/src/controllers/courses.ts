import type { Request, Response } from 'express';
import { q } from '../db.js';
import { need, ok } from '../http.js';

const MODES = ['online', 'onsite', 'hybrid'];
export const COLUMNS ='subject, title, rate, duration_hours, description, tags, mode, syllabus, active';

/** Cleans a list of short texts: trimmed, no blanks or duplicates, capped. */
const list = (v: unknown, max: number) =>
  Array.isArray(v) ? [...new Set(v.map((s) => String(s).trim().slice(0, 120)).filter(Boolean))].slice(0, max) : [];

/** Validated values for COLUMNS, in order, from a request body. */
export function fields(b: any) {
  const rate = Number(b?.rate), hours = Number(b?.duration_hours ?? 2), mode = b?.mode ?? 'online';
  need(b?.title && b?.description, 400, 'Course title and description are required');
  need(Number.isInteger(rate) && rate >= 0, 400, 'Rate must be a whole number of baht, 0 or more');
  need(hours > 0 && hours <= 12, 400, 'Duration must be between 0 and 12 hours');
  need(MODES.includes(mode), 400, `Mode must be one of: ${MODES.join(', ')}`);
  const tags = b.tags === undefined ? ['เปิดใหม่'] : list(b.tags, 10);
  return [b.subject || 'General', b.title, rate, hours, b.description, tags, mode, list(b.syllabus, 20), b.active !== false];
}

export const catalog = async (_req: Request, res: Response) => {
  ok(res, await q(
    `SELECT c.code, c.subject, c.title, c.rate, c.duration_hours, c.tags, c.mode, c.syllabus, c.description,
            t.id AS tutor_id, t.name AS tutor_name, t.avatar, t.rating, t.schedule
     FROM courses c JOIN tutors t ON t.id = c.tutor_id WHERE c.active ORDER BY c.created_at, c.code`,
  ));
};

export async function create(req: Request, res: Response) {
  const [row] = await q(
    `INSERT INTO courses (code, tutor_id, ${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING code`,
    [`course-${Date.now().toString(36)}`, req.params.id, ...fields(req.body)],
  );
  ok(res, row, 201);
}

export async function update(req: Request, res: Response) {
  const [row] = await q(
    `UPDATE courses SET (${COLUMNS}) = ($2, $3, $4, $5, $6, $7, $8, $9, $10) WHERE code = $1 RETURNING code`,
    [req.params.code, ...fields(req.body)],
  );
  need(row, 404, 'Course not found');
  ok(res, row);
}

export async function remove(req: Request, res: Response) {
  const [row] = await q('DELETE FROM courses WHERE code = $1 RETURNING code', [req.params.code]);
  need(row, 404, 'Course not found');
  ok(res);
}
