import type { Request, Response } from 'express';
import { q, seed } from '../db.js';
import { ok } from '../http.js';

/** Accounts for the sandbox role switcher. */
export async function users(_req: Request, res: Response) {
  const [tutors, students] = await Promise.all([
    q('SELECT id, name, avatar FROM tutors ORDER BY created_at, id'),
    q(`SELECT id, name, '🎓' AS avatar FROM students ORDER BY id`),
  ]);
  ok(res, { tutors, students });
}

export async function reset(_req: Request, res: Response) {
  await seed();
  ok(res);
}
