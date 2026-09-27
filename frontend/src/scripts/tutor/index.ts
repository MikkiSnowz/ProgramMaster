import { api, session } from '../../lib/api';
import { $, baht, fail, notify } from '../../lib/ui';
import { renderCalendar } from './calendar';
import { renderCourses } from './courses';
import { renderRequests } from './requests';
import { renderSchedule } from './schedule';

const TAB_KEY = 'tutorTab';
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-tab]')];

function showTab(id: string) {
  if (!tabs.some((t) => t.dataset.tab === id)) id = 'overview';
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
  document.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => (p.hidden = p.id !== id));
  localStorage.setItem(TAB_KEY, id);
}

/** Fetches the dashboard and re-renders every panel; passed to sub-modules to call after writes. */
async function load() {
  const { profile: p, requests, sessions, courses } = await api(`/tutors/${session.id}/dashboard`);
  $('avatar').textContent = p.avatar;
  $('tutorName').textContent = p.name;
  $('tutorBio').textContent = p.bio || 'ติวเตอร์ผู้เชี่ยวชาญ TutorMatch';
  $('statEarnings').textContent = `${baht(p.earnings_this_month)} บาท`;
  $('statHours').textContent = `${p.total_hours_taught} ชม.`;
  $('statRating').textContent = `${p.rating.toFixed(1)} / 5.0`;
  $('statCourses').textContent = `${courses.length} คอร์ส`;
  $<HTMLInputElement>('profileName').value = p.name;
  renderCalendar(sessions);
  renderRequests(requests, load);
  renderSchedule(p.id, p.schedule);
  renderCourses(p.id, courses, load);
}

$<HTMLFormElement>('profileForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api(`/tutors/${session.id}`, 'PATCH', { name: $<HTMLInputElement>('profileName').value });
    await notify('อัปเดตข้อมูลบัญชีเรียบร้อยแล้ว', 'บันทึกสำเร็จ');
    await load();
  } catch (err) {
    fail(err);
  }
};

if (session.role !== 'tutor') location.href = '/';
else {
  tabs.forEach((t) => (t.onclick = () => showTab(t.dataset.tab!)));
  showTab(localStorage.getItem(TAB_KEY) ?? 'overview');
  load()
    .catch((err) => {
      $('tutorName').textContent = 'ไม่พบข้อมูลติวเตอร์';
      fail(err);
    })
    .finally(() => $('workspace').classList.remove('opacity-0'));
}
