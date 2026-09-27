import { api, session } from '../lib/api';
import { iso, mountCalendar } from '../lib/calendar';
import { MODES, type CatalogCourse } from '../lib/model';
import { $, baht, esc, fail, notify } from '../lib/ui';

const form = $<HTMLFormElement>('bookingForm');
const today = iso(new Date());
let course: CatalogCourse | undefined;
let picked = '';

const renderCalendar = mountCalendar($('bookingCalendar'), (d) => {
  const day = iso(d);
  const open = !!course?.schedule[d.getDay()] && day >= today;
  return `<div class="cal-day ${open ? 'open' : ''} ${day === picked ? 'picked' : ''}" data-date="${day}">${d.getDate()}</div>`;
}, true);

$('bookingCalendar').addEventListener('click', (e) => {
  const cell = (e.target as HTMLElement).closest<HTMLElement>('.cal-day.open');
  if (!cell || !course) return;
  picked = cell.dataset.date!;
  const ranges = course.schedule[new Date(`${picked}T00:00`).getDay()];
  $('dayHint').textContent = `ช่วงเวลาที่ติวเตอร์ว่างวันนี้: ${ranges.map((r) => r.join('–')).join(', ')}`;
  renderCalendar();
});

form.onsubmit = async (e) => {
  e.preventDefault();
  if (!picked) return notify('กรุณาเลือกวันที่ต้องการเรียนจากปฏิทินก่อนส่งคำขอ', 'คำเตือนระบบ');
  const { studentName, startTime, notes } = Object.fromEntries(new FormData(form));
  try {
    await api('/bookings', 'POST', { studentName, startTime, notes, date: picked, courseCode: course!.code });
    await notify(`ส่งคำขอเรียนวันที่ ${picked} เวลา ${startTime} สำเร็จ! ระบบคำนวณเวลาจบตามความยาวคอร์สให้อัตโนมัติ`, 'ส่งคำขอสำเร็จ');
    location.href = session.role === 'student' ? '/student/dashboard' : '/';
  } catch (err) {
    fail(err);
  }
};

async function load() {
  const code = new URLSearchParams(location.search).get('course');
  const [catalog, student] = await Promise.all([
    api<CatalogCourse[]>('/marketplace/catalog'),
    session.role === 'student' ? api(`/students/${session.id}`).catch(() => null) : null,
  ]);
  course = catalog.find((c) => c.code === code);
  if (!course) {
    await notify('ไม่พบคอร์สที่เลือก กรุณาเลือกคอร์สจากหน้าหลัก', 'ไม่พบคอร์ส');
    return void (location.href = '/');
  }
  $('sumCourse').textContent = course.title;
  $('sumTutor').innerHTML = `${esc(course.avatar)} ${esc(course.tutor_name)}`;
  $('sumMode').textContent = MODES[course.mode];
  $('sumDuration').textContent = `${course.duration_hours} ชั่วโมง`;
  $('syllabus').hidden = !course.syllabus.length;
  $('syllabus').querySelector('ol')!.innerHTML = course.syllabus.map((s) => `<li>${esc(s)}</li>`).join('');
  $('sumRate').textContent = `${baht(course.rate)} บาท / ชั่วโมง`;
  if (student) {
    form.studentName.value = student.name;
    form.phone.value = student.phone;
  }
  renderCalendar();
}

load().catch(fail);
