import { iso, mountCalendar } from '../../lib/calendar';
import { $, esc, hhmm, thaiDate } from '../../lib/ui';

type Session = {
  student_name: string; course_title: string; date: string; start_time: string; end_time: string;
  hours: number; notes: string | null; level: string | null; phone: string | null; email: string | null;
};

const root = $('tutorCalendar');
const detail = $('sessionDetail');
let sessions: Session[] = [];
let picked = '';

const longDate = (d: string) =>
  new Date(`${d}T00:00`).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const time = (s: Session) => `${hhmm(s.start_time)}–${hhmm(s.end_time)}`;

const chip = (s: Session) =>
  `<span class="block w-full truncate rounded-sm bg-accent-soft px-1 text-[0.7rem] font-medium text-accent">${hhmm(s.start_time)} ${esc(s.student_name.split(' ')[0])}</span>`;

const render = mountCalendar(root, (d) => {
  const day = iso(d);
  const list = sessions.filter((s) => s.date === day);
  const today = day === iso(new Date()) ? 'font-bold text-ink underline decoration-accent decoration-2 underline-offset-4' : '';
  if (!list.length) return `<div class="flex min-h-18 flex-col rounded-md border border-line/60 p-1.5 text-left text-xs text-muted ${today}">${d.getDate()}</div>`;
  const tone = day === picked ? 'border-accent ring-2 ring-accent/20' : 'border-line hover:border-accent/60';
  return `<button type="button" data-date="${day}" aria-expanded="${day === picked}" title="ดูรายละเอียด ${list.length} คลาส"
    class="flex min-h-18 flex-col items-start gap-1 rounded-md border bg-surface p-1.5 text-left text-xs font-semibold transition ${tone}">
    <span class="${today}">${d.getDate()}</span>${list.map(chip).join('')}</button>`;
});

const contact = (label: string, href: string, value: string) =>
  `<div><dt class="muted">${label}</dt><dd><a class="link" href="${href}:${esc(value)}">${esc(value)}</a></dd></div>`;

const card = (s: Session) => `
  <article class="flex flex-col gap-3 rounded-lg border border-line bg-paper/60 p-4">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h4 class="font-semibold">${esc(s.student_name)}${s.level ? ` <span class="text-sm font-normal text-muted">· ${esc(s.level)}</span>` : ''}</h4>
        <p class="text-sm text-muted">${esc(s.course_title)}</p>
      </div>
      <span class="pill-ok">ยืนยันแล้ว</span>
    </div>
    <dl class="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 *:flex *:gap-2">
      <div><dt class="muted">เวลา</dt><dd class="font-medium">${time(s)} (${s.hours} ชม.)</dd></div>
      <div><dt class="muted">วันที่</dt><dd class="font-medium">${thaiDate(s.date)}</dd></div>
      ${s.phone ? contact('โทร', 'tel', s.phone) : ''}
      ${s.email ? contact('อีเมล', 'mailto', s.email) : ''}
    </dl>
    ${s.notes ? `<p class="border-l-2 border-accent pl-3 text-sm text-muted">“${esc(s.notes)}”</p>` : ''}
  </article>`;

function paintDetail() {
  const list = sessions.filter((s) => s.date === picked);
  if (list.length) {
    detail.innerHTML = `
      <div class="flex items-center justify-between border-t border-line pt-4">
        <h3 class="font-semibold">${longDate(picked)} · ${list.length} คลาส</h3>
        <button type="button" data-close class="text-sm text-muted hover:text-ink">ย่อ</button>
      </div>${list.map(card).join('')}`;
    return;
  }
  const next = sessions.find((s) => s.date >= iso(new Date()));
  detail.innerHTML = `<p class="muted border-t border-line pt-4 text-sm">${next
    ? `คลาสถัดไป: <button type="button" data-date="${next.date}" class="link">${thaiDate(next.date)} ${time(next)} กับ ${esc(next.student_name)}</button>`
    : 'ยังไม่มีคลาสที่กำลังจะมาถึง'}</p>`;
}

function select(day: string) {
  picked = picked === day ? '' : day;
  render(picked ? new Date(`${picked}T00:00`) : undefined);
  paintDetail();
}

root.addEventListener('click', (e) => {
  const day = (e.target as HTMLElement).closest<HTMLElement>('[data-date]')?.dataset.date;
  if (day) select(day);
});

detail.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  if (el.closest('[data-close]')) select(picked);
  else if (el.dataset.date) {
    select(el.dataset.date);
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

export function renderCalendar(list: Session[]) {
  sessions = list;
  render();
  paintDetail();
}
