import type { Request, Response } from 'express';
import { q } from '../db.js';
import { need, ok } from '../http.js';

// Bookings are keyed by student name (the checkout form collects a free-text name).
const HISTORY = `
  SELECT r.status, c.title, t.name AS tutor, r.booking_date AS date, r.start_time, r.end_time, 0 AS hours
  FROM incoming_requests r JOIN courses c ON c.code = r.course_code JOIN tutors t ON t.id = r.tutor_id
  WHERE r.student_name = $1
  UNION ALL
  SELECT 'approved', s.course_title, t.name, s.date, s.start_time, s.end_time, s.hours
  FROM booked_sessions s JOIN tutors t ON t.id = s.tutor_id
  WHERE s.student_name = $1
  ORDER BY date DESC, start_time DESC`;

export async function get(req: Request, res: Response) {
  const [student] = await q('SELECT id, name, level, email, phone FROM students WHERE id = $1', [req.params.id]);
  need(student, 404, 'Student not found');
  ok(res, { ...student, history: await q(HISTORY, [student.name]) });
}
