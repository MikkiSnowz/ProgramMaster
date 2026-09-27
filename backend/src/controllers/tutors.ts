import type { Request, Response } from 'express';
import { q } from '../db.js';
import { need, ok } from '../http.js';
import { COLUMNS, fields } from './courses.js';

const DEFAULT_SCHEDULE = { 1: [['09:00', '11:00'], ['13:00', '15:00']] };
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const validSchedule = (s: unknown) =>
  !!s && typeof s === 'object' && !Array.isArray(s) &&
  Object.entries(s).every(([day, ranges]) => /^[0-6]$/.test(day) && Array.isArray(ranges) &&
    ranges.every((r) => Array.isArray(r) && r.length === 2 && TIME.test(r[0]) && TIME.test(r[1]) && r[0] < r[1]));

export async function dashboard(req: Request, res: Response) {
  const id = req.params.id;
  const [[profile], requests, sessions, courses] = await Promise.all([
    q('SELECT * FROM tutors WHERE id = $1', [id]),
    q(`SELECT r.id, r.student_name, c.title AS course_title, r.booking_date, r.start_time, r.end_time, r.notes
       FROM incoming_requests r JOIN courses c ON c.code = r.course_code
       WHERE r.tutor_id = $1 AND r.status = 'pending' ORDER BY r.booking_date, r.start_time`, [id]),
    q(`SELECT b.id, b.student_name, b.course_title, b.date, b.start_time, b.end_time, b.hours, b.notes,
              s.level, s.phone, s.email
       FROM booked_sessions b LEFT JOIN students s ON s.name = b.student_name
       WHERE b.tutor_id = $1 ORDER BY b.date, b.start_time`, [id]),
    q(`SELECT c.code, ${COLUMNS},
              (SELECT count(*) FROM incoming_requests r WHERE r.course_code = c.code AND r.status = 'pending') AS pending,
              (SELECT count(*) FROM booked_sessions b WHERE b.tutor_id = c.tutor_id AND b.course_title = c.title) AS booked
       FROM courses c WHERE c.tutor_id = $1 ORDER BY c.created_at, c.code`, [id]),
  ]);
  need(profile, 404, 'Tutor not found');
  ok(res, { profile, requests, sessions, courses });
}

/** Creates a tutor together with their first course in one atomic statement. */
export async function register(req: Request, res: Response) {
  const { name, bio, course } = req.body ?? {};
  need(name, 400, 'Name is required');
  const id = `tutor-${Date.now().toString(36)}`;
  await q(
    `WITH t AS (INSERT INTO tutors (id, name, bio, schedule) VALUES ($1, $2, $3, $4) RETURNING id)
     INSERT INTO courses (code, tutor_id, ${COLUMNS})
     SELECT $5, id, $6, $7, $8, $9, $10, $11, $12, $13, $14 FROM t`,
    [id, name, bio, DEFAULT_SCHEDULE, `course-${Date.now().toString(36)}`, ...fields(course)],
  );
  ok(res, { id }, 201);
}

export async function update(req: Request, res: Response) {
  const { name, schedule } = req.body ?? {};
  need(name || schedule, 400, 'Nothing to update');
  need(!schedule || validSchedule(schedule), 400, 'Invalid schedule: each range needs start < end (HH:MM)');
  const [row] = await q(
    'UPDATE tutors SET name = COALESCE($2, name), schedule = COALESCE($3, schedule) WHERE id = $1 RETURNING id',
    [req.params.id, name || null, schedule ?? null],
  );
  need(row, 404, 'Tutor not found');
  ok(res);
}
