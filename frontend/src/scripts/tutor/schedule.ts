import { api } from '../../lib/api';
import { DAY_END, DAY_START, type Schedule } from '../../lib/model';
import { $, fail, notify } from '../../lib/ui';

// Draft keeps a day's ranges while it is switched off, so toggling back restores them.
type Range = [string, string];
type Day = { on: boolean; ranges: Range[] };

const grid = $('weekGrid');
const rows = [...grid.querySelectorAll<HTMLElement>('[data-day]')];
let tutorId = '';
let draft: Record<string, Day> = {};

const minutes = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const hhmm = (h: number) => `${String(h).padStart(2, '0')}:00`;
const pct = (t: string) => Math.min(Math.max((minutes(t) / 60 - DAY_START) / (DAY_END - DAY_START), 0), 1) * 100;
const hours = (ranges: Range[]) => ranges.reduce((sum, [s, e]) => sum + Math.max(minutes(e) - minutes(s), 0), 0) / 60;
const dayOf = (el: Element) => el.closest<HTMLElement>('[data-day]')!;

/** Indexes of ranges that are backwards (end ≤ start) or overlap another range. */
function conflicts(ranges: Range[]) {
  const bad = new Set<number>();
  ranges.forEach(([s, e], i) => {
    if (s >= e) bad.add(i);
    ranges.forEach(([s2, e2], j) => { if (i !== j && s < e2 && s2 < e) bad.add(i); });
  });
  return bad;
}

/** Redraws a day's timeline bar and hour total without touching its inputs (keeps focus while typing). */
function paintTimeline(row: HTMLElement) {
  const { on, ranges } = draft[row.dataset.day!];
  const bad = conflicts(ranges);
  row.querySelector('.blocks')!.innerHTML = ranges.map(([s, e], i) => {
    const left = pct(s);
    const tone = bad.has(i) ? 'bg-danger-soft text-danger ring-1 ring-red-400'
      : on ? 'bg-accent text-white hover:bg-accent/90' : 'bg-line text-muted';
    return `<button type="button" data-block="${i}" title="${s}–${e}" style="left:${left}%;width:${Math.max(pct(e) - left, 1)}%"
      class="absolute inset-y-1 overflow-hidden rounded px-1 text-[0.7rem] font-medium whitespace-nowrap ${tone}">${s}–${e}</button>`;
  }).join('');
  row.querySelector('.total')!.textContent = on ? `รวม ${+hours(ranges).toFixed(2)} ชม.` : 'ปิดรับสอน';
  row.querySelector('.warn')!.textContent = on && bad.size ? 'มีช่วงเวลาทับซ้อน หรือเวลาจบก่อนเวลาเริ่ม' : '';
}

function paintSummary() {
  const open = Object.values(draft).filter((d) => d.on);
  $('activeDays').textContent = `${open.length} วันทำการ · ${+open.reduce((s, d) => s + hours(d.ranges), 0).toFixed(2)} ชม./สัปดาห์`;
}

const input = (v: string, i: number, k: number, on: boolean) =>
  `<input type="time" value="${v}" data-i="${i}" data-k="${k}" ${on ? '' : 'disabled'} class="w-auto border-0 bg-transparent p-0 text-sm font-medium focus:ring-0" />`;

function paint() {
  for (const row of rows) {
    const { on, ranges } = draft[row.dataset.day!];
    row.classList.toggle('opacity-55', !on);
    row.querySelector<HTMLInputElement>('.toggle')!.checked = on;
    row.querySelector<HTMLButtonElement>('.add')!.disabled = !on;
    row.querySelector('.timeline')!.classList.toggle('cursor-copy', on);
    row.querySelector('.ranges')!.innerHTML = ranges.map(([s, e], i) => `
      <div class="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 focus-within:border-accent">
        ${input(s, i, 0, on)}<span class="text-sm text-muted">ถึง</span>${input(e, i, 1, on)}
        ${ranges.length > 1 && on ? `<button type="button" class="remove text-lg leading-none text-muted hover:text-danger" data-i="${i}" aria-label="ลบช่วงเวลา">×</button>` : ''}
      </div>`).join('');
    paintTimeline(row);
  }
  paintSummary();
}

export function renderSchedule(id: string, schedule: Schedule) {
  tutorId = id;
  draft = Object.fromEntries(rows.map(({ dataset: { day } }) => [day!, { on: !!schedule[day!], ranges: schedule[day!] ?? [['09:00', '17:00']] }]));
  paint();
}

grid.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  const row = dayOf(el);
  const day = draft[row.dataset.day!];
  if (el.classList.contains('toggle')) {
    day.on = el.checked;
    return paint();
  }
  if (!el.value) return;
  day.ranges[+el.dataset.i!][+el.dataset.k!] = el.value;
  paintTimeline(row);
  paintSummary();
});

grid.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const row = el.closest<HTMLElement>('[data-day]');
  if (!row) return;
  const day = draft[row.dataset.day!];
  const block = el.closest<HTMLElement>('[data-block]');
  const timeline = el.closest<HTMLElement>('.timeline');

  if (block) return row.querySelector<HTMLInputElement>(`input[data-i="${block.dataset.block}"]`)?.focus();
  if (timeline && day.on) {
    const { left, width } = timeline.getBoundingClientRect();
    const h = Math.min(Math.floor(DAY_START + ((e.clientX - left) / width) * (DAY_END - DAY_START)), 21);
    day.ranges.push([hhmm(h), hhmm(h + 2)]);
  } else if (el.closest('.add')) {
    const end = day.ranges.at(-1)?.[1] ?? '12:00';
    const h = Math.min(+end.slice(0, 2) + 1, 21);
    day.ranges.push([hhmm(h), hhmm(h + 2)]);
  } else if (el.classList.contains('remove')) day.ranges.splice(+el.dataset.i!, 1);
  else return;
  paint();
});

$('saveSchedule').onclick = async () => {
  const open = Object.entries(draft).filter(([, d]) => d.on);
  if (open.some(([, d]) => conflicts(d.ranges).size)) {
    return notify('มีช่วงเวลาที่ทับซ้อนหรือเวลาจบก่อนเวลาเริ่ม (แสดงเป็นสีแดง) กรุณาแก้ไขก่อนบันทึก', 'ตรวจสอบช่วงเวลา');
  }
  const schedule = Object.fromEntries(open.map(([day, d]) => [day, [...d.ranges].sort(([a], [b]) => a.localeCompare(b))]));
  try {
    await api(`/tutors/${tutorId}`, 'PATCH', { schedule });
    await notify('บันทึกเวลาสอนแล้ว นักเรียนจะเห็นวันว่างใหม่ทันที', 'บันทึกเวลาสอนแล้ว');
  } catch (err) {
    fail(err);
  }
};
