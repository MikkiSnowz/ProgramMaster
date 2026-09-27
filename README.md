# TutorMatch

A marketplace for one-to-one tutoring. Students browse courses, see when tutors are actually free, and send booking requests. Tutors manage their weekly schedule, courses and incoming requests from a dashboard. The UI is in Thai.

| Layer | Stack |
| --- | --- |
| Frontend | Astro 7 (static output) + Tailwind CSS 4, TypeScript, served by Nginx |
| Backend | Node.js 22 + Express 5, TypeScript |
| Database | PostgreSQL 15 |
| Infra | Docker Compose |

## Quick start

Requires Docker with the Compose plugin.

```sh
cp .env.example .env      # then set a real POSTGRES_PASSWORD (and the same one in DATABASE_URL)
docker compose up -d --build
```

Open http://localhost:8085 (or whatever `FRONTEND_PORT` you set).

On first boot the backend creates the schema and seeds demo tutors, courses, students and bookings. The **รีเซ็ตข้อมูล** button in the navbar (or `POST /api/system/reset`) restores that demo data at any time.

### Trying it out

There is no real login yet. The account menu in the navbar switches between demo users, for example the student `น้องมินตรา` or the tutor `ดร. อริศรา`. Your choice is stored in the browser's localStorage.

- **As a student:** filter courses on `/`, book one at checkout, then follow its status on `/student/dashboard`.
- **As a tutor:** on `/tutor/dashboard`, confirm or reject requests, see confirmed classes on the calendar, set weekly teaching hours on the timeline, and manage courses.

## Local development

To run the frontend with hot reload, keep Postgres and the backend in Docker and start Astro on the host:

```sh
docker compose up -d postgres-db backend
cd frontend
npm install
npx astro dev --background   # http://localhost:4321; /api is proxied to localhost:5000
```

Manage the background server with `npx astro dev status`, `npx astro dev logs` and `npx astro dev stop`.

To run the backend on the host too, point `DATABASE_URL` in `.env` at `localhost:${PGPORT}`, then:

```sh
cd backend
npm install
DOTENV_CONFIG_PATH=../.env npm run dev   # tsx watch on :5000
```

Type-check with `npx tsc --noEmit` in either package. Build with `npm run build`.

## Project structure

```text
backend/src/
  server.ts              Express app: JSON, /api router, error handler
  db.ts                  pg pool, q() helper, initDb() and seed()
  sql.ts                 SCHEMA (idempotent, also migrates) and SEED (demo data)
  http.ts                HttpError, need(), ok(), error handler
  routes.ts              every /api route
  controllers/           tutors, courses, bookings, students, system
frontend/src/
  styles/global.css      Tailwind theme tokens and shared component classes
  lib/                   api client and session, UI helpers and modals, types and constants, calendar
  layouts/Layout.astro   navbar, footer, alert and confirm modals
  components/            StatCard, MonthCalendar, tutor dashboard tabs
  pages/                 /, /about, /register, /checkout, /student/dashboard, /tutor/dashboard
  scripts/               client-side script for each page
docker-compose.yml       postgres-db, backend, frontend
```

The browser always calls the relative path `/api`. Nginx proxies it to the backend in Docker, and Vite does the same under `astro dev`.

## API

Every response has the shape `{ success: true, data }` or `{ success: false, error }`. Invalid input returns 400 and a missing record returns 404.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/marketplace/catalog` | Active courses with tutor info and weekly schedule |
| POST | `/api/tutors` | Register a tutor with their first course |
| GET | `/api/tutors/:id/dashboard` | Profile, pending requests, confirmed sessions, courses with stats |
| PATCH | `/api/tutors/:id` | Update `name` and/or `schedule` |
| POST | `/api/tutors/:id/courses` | Add a course |
| PUT / DELETE | `/api/courses/:code` | Edit or delete a course |
| POST | `/api/bookings` | Request a class. The end time is computed from the course length. |
| PATCH | `/api/bookings/:id/status` | `approved` moves the request into confirmed sessions; `rejected` declines it |
| GET | `/api/students/:id` | Student profile and booking history |
| GET | `/api/users` | Demo accounts for the navbar menu |
| POST | `/api/system/reset` | Wipe everything and re-seed the demo data |

A tutor's `schedule` is JSON keyed by weekday (`0` = Sunday), with a list of `["HH:MM", "HH:MM"]` ranges for each day:

```json
{ "1": [["09:00", "11:00"], ["13:00", "15:00"]], "3": [["17:00", "19:00"]] }
```

## Design

The theme is set with tokens in `frontend/src/styles/global.css`: `paper`, `surface`, `ink`, `muted`, `line`, `accent`, plus `warn` and `danger`. Use them as Tailwind classes (`bg-surface`, `text-muted`, `border-line`) rather than raw palette colours. Body text uses IBM Plex Sans Thai and headings use Noto Serif Thai. Avoid letter-spacing on Thai text; it breaks the glyph clusters.

## Known limitations

- Authentication is a sandbox role switcher, not real login.
- Bookings are linked to students by the free-text name entered at checkout, and the phone number is not stored.
- The server checks that a booking falls on a teaching day, but not that the start time is inside the tutor's hours.
