import { api } from '../lib/api';
import { covers, MODES, type CatalogCourse } from '../lib/model';
import { $, baht, esc, fail } from '../lib/ui';

const form = $<HTMLFormElement>('filters');
const grid = $('grid');
let courses: CatalogCourse[] = [];

const card = (c: CatalogCourse) => `
  <article class="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 transition hover:border-ink/25">
    <div class="flex items-center gap-3">
      <div class="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-2xl">${esc(c.avatar)}</div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">${esc(c.tutor_name)}</p>
        <p class="text-sm text-warn">★ ${c.rating.toFixed(1)}</p>
      </div>
      <span class="pill">${esc(c.subject)}</span>
    </div>
    <div>
      <h3 class="text-lg leading-snug font-semibold">${esc(c.title)}</h3>
      <p class="muted mt-2 line-clamp-3 text-sm leading-relaxed">${esc(c.description)}</p>
    </div>
    <div class="flex flex-wrap gap-1.5">${c.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join('')}</div>
    <div class="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
      <div>
        <p data-price class="text-xl font-semibold">${baht(c.rate)} ฿<span class="text-sm font-normal text-muted"> /ชม.</span></p>
        <p class="text-xs text-muted">${MODES[c.mode]} · ${c.duration_hours} ชม./ครั้ง</p>
      </div>
      <a href="/checkout?course=${encodeURIComponent(c.code)}" class="btn-primary">จองเรียน</a>
    </div>
  </article>`;

function render() {
  const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
  const [min, max] = f.budget ? f.budget.split('-').map((n) => Number(n) || 0) : [0, 0];
  const list = courses.filter((c) =>
    (!f.subject || c.subject === f.subject) &&
    (!f.time || covers(c.schedule, f.time)) &&
    c.rate >= min && (!max || c.rate <= max) &&
    (!f.level || c.tags.includes(f.level)) &&
    (!f.mode || c.mode === f.mode || c.mode === 'hybrid'));
  if (f.sort) list.sort((a, b) => (f.sort === 'asc' ? a.rate - b.rate : b.rate - a.rate));
  $('resultCount').textContent = `พบ ${list.length} คอร์ส`;
  grid.innerHTML = list.map(card).join('') || '<p class="muted col-span-full">ไม่พบคอร์สที่ตรงกับเงื่อนไข ลองปรับตัวกรองดูอีกครั้ง</p>';
}

form.onchange = render;

api<CatalogCourse[]>('/marketplace/catalog').then((data) => {
  courses = data;
  const subjects = [...new Set(data.map((c) => c.subject))];
  form.subject.insertAdjacentHTML('beforeend', subjects.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join(''));
  render();
}, fail);
