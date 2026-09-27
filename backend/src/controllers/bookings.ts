import type { Request, Response } from 'express';
import { q } from '../db.js';
import { need, ok } from '../http.js';

// End time comes from the course length; the day must be in the future and open in the tutor's schedule.
const SUBMIT = `
  INSERT INTO incoming_requests (student_name, tutor_id, course_code, booking_date, start_time, end_time, notes)
  SELECT $1, c.tutor_id, c.code, $3::date, $4::time, $4::time + c.duration_hours * interval '1 hour', $5
  FROM courses c JOIN tutors t ON t.id = c.tutor_id
  WHERE c.code = $2 AND c.active AND $3::date >= CURRENT_DATE AND t.schedule ? extract(dow FROM $3::date)::int::text
  RETURNING id`;

// Approving moves the request into booked_sessions and credits the tutor, all in one atomic statement.
const APPROVE = `
  WITH r AS (DELETE FROM incoming_requests WHERE id = $1 AND status = 'pending' RETURNING *),
  c AS (SELECT r.*, co.title, co.rate, co.duration_hours FROM r JOIN courses co ON co.code = r.course_code),
  s AS (INSERT INTO booked_sessions (student_name, tutor_id, course_title, date, start_time, end_time, hours, notes)
        SELECT student_name, tutor_id, title, booking_date, start_time, end_time, duration_hours, notes FROM c)
  UPDATE tutors t SET earnings_this_month = earnings_this_month + round(c.rate * c.duration_hours),
    total_hours_taught = total_hours_taught + c.duration_hours, total_students = total_students + 1
  FROM c WHERE t.id = c.tutor_id RETURNING t.id`;

const REJECT = `UPDATE incoming_requests SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING id`;

export async function submit(req: Request, res: Response) {
  const { studentName, courseCode, date, startTime, notes } = req.body ?? {};
  const [row] = await q(SUBMIT, [studentName, courseCode, date, startTime, notes]);
  need(row, 400, 'Course not found or closed, date is in the past, or the tutor does not teach on that day');
  ok(res, row, 201);
}

export async function setStatus(req: Request, res: Response) {
  const { status } = req.body ?? {};
  need(status === 'approved' || status === 'rejected', 400, 'Status must be approved or rejected');
  const [row] = await q(status === 'approved' ? APPROVE : REJECT, [req.params.id]);
  need(row, 404, 'Pending request not found');
  ok(res);
}
