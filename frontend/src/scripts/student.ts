import { api, session } from '../lib/api';
import { $, esc, fail, hhmm, thaiDate } from '../lib/ui';

type Entry = { status: 'pending' | 'approved' | 'rejected'; title: string; tutor: string; date: string; start_time: string; end_time: string; hours: number };

const STATUS = {
  approved: ['ยืนยันแล้ว', 'pill-ok'],
  pending: ['รอการยืนยัน', 'pill-wait'],
  rejected: ['ถูกปฏิเสธ', 'pill-bad'],
};

const row = (h: Entry) => `
  <div class="row flex-col items-start sm:flex-row sm:items-center">
    <div>
      <h4 class="font-semibold">${esc(h.title)}</h4>
      <p class="muted mt-0.5 text-sm">${esc(h.tutor)} · ${thaiDate(h.date)} · ${hhmm(h.start_time)}–${hhmm(h.end_time)}</p>
    </div>
    <span class="${STATUS[h.status][1]}">${STATUS[h.status][0]}</span>
  </div>`;

async function load() {
  const s = await api<{ name: string; level: string; history: Entry[] }>(`/students/${session.id}`);
  const hour = new Date().getHours();
  $('greeting').textContent = `สวัสดีตอน${hour < 12 ? 'เช้า' : hour < 17 ? 'บ่าย' : 'เย็น'}, ${s.name}`;
  $('level').textContent = `ระดับการศึกษา: ${s.level}`;
  $('statCourses').textContent = `${s.history.length} คอร์ส`;
  $('statHours').textContent = `${s.history.reduce((sum, h) => sum + h.hours, 0)} ชม.`;
  $('statPending').textContent = `${s.history.filter((h) => h.status === 'pending').length} รายการ`;
  $('history').innerHTML = s.history.map(row).join('') ||
    '<p class="muted">ยังไม่มีการจองเรียน <a href="/" class="link">ค้นหาคอร์สแรกของคุณ</a></p>';
}

if (session.role !== 'student') location.href = '/';
else load().catch(fail).finally(() => $('workspace').classList.remove('opacity-0'));
