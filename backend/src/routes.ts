import { Router } from 'express';
import * as bookings from './controllers/bookings.js';
import * as courses from './controllers/courses.js';
import * as students from './controllers/students.js';
import * as system from './controllers/system.js';
import * as tutors from './controllers/tutors.js';

export default Router()
  .get('/marketplace/catalog', courses.catalog)
  .post('/tutors', tutors.register)
  .get('/tutors/:id/dashboard', tutors.dashboard)
  .patch('/tutors/:id', tutors.update)
  .post('/tutors/:id/courses', courses.create)
  .put('/courses/:code', courses.update)
  .delete('/courses/:code', courses.remove)
  .post('/bookings', bookings.submit)
  .patch('/bookings/:id/status', bookings.setStatus)
  .get('/students/:id', students.get)
  .get('/users', system.users)
  .post('/system/reset', system.reset);
