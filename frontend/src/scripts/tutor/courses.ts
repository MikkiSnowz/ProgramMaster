import { api } from '../../lib/api';
import { LEVELS, MODES, type Course } from '../../lib/model';
import { $, ask, baht, closeModal, esc, fail, notify, openModal } from '../../lib/ui';

const list = $('courseList');
const modal = $('courseModal');
const form = $<HTMLFormElement>('courseForm');
const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
let tutorId = '';
let courses: Course[] = [];
let editing: Course | undefined;
let reload = async () => {};

const row = (c: Course) => `
  <div class="row flex-col items-stretch bg-surface md:flex-row md:items-center ${c.active ? '' : 'opacity-60'}">
    <div class="flex flex-1 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <h4 class="font-semibold">${esc(c.title)}</h4>
        ${c.active ? '<span class="pill-ok">เปิดรับสมัคร</span>' : '<span class="pill">ซ่อนอยู่</span>'}
      </div>
      <p class="muted line-clamp-2 text-sm">${esc(c.subject)} · ${MODES[c.mode]} · ${c.duration_hours} ชม./ครั้ง — ${esc(c.description)}</p>
      <div class="flex flex-wrap gap-1.5">
        ${c.tags.map((t) => `<span class="${LEVELS.includes(t) ? 'pill-ok' : 'pill'}">${esc(t)}</span>`).join('')}
        ${c.syllabus.length ? `<span class="pill">${c.syllabus.length} หัวข้อ</span>` : ''}
      </div>
      <p class="text-xs text-muted">รอยืนยัน ${c.pending ?? 0} · สอนแล้ว/นัดแล้ว ${c.booked ?? 0} คลาส</p>
    </div>
    <div class="flex items-center gap-3 md:flex-col md:items-end">
      <span class="font-semibold whitespace-nowrap">${baht(c.rate)} ฿<span class="text-sm font-normal text-muted"> /ชม.</span></span>
      <div class="flex gap-2">
        <button type="button" data-toggle="${esc(c.code)}" class="btn-muted py-1.5">${c.active ? 'ซ่อน' : 'เปิด'}</button>
        <button type="button" data-edit="${esc(c.code)}" class="btn-muted py-1.5">แก้ไข</button>
      </div>
    </div>
  </div>`;

export function renderCourses(id: string, data: Course[], onChange: () => Promise<void>) {
  [tutorId, courses, reload] = [id, data, onChange];
  list.innerHTML = data.map(row).join('') || '<p class="muted">คุณยังไม่มีรายวิชาเปิดสอนในขณะนี้</p>';
}

function open(c?: Course) {
  editing = c;
  form.reset();
  const values = c ?? { title: '', subject: 'General', mode: 'online', rate: '', duration_hours: 2, description: '' };
  for (const key of ['title', 'subject', 'mode', 'rate', 'duration_hours', 'description'] as const) field(key).value = String(values[key]);
  field('active').checked = c?.active ?? true;
  form.querySelectorAll<HTMLInputElement>('[name=level]').forEach((box) => (box.checked = !!c?.tags.includes(box.value)));
  field('extraTags').value = (c?.tags ?? ['เปิดใหม่']).filter((t) => !LEVELS.includes(t)).join(', ');
  field('syllabus').value = c?.syllabus.join('\n') ?? '';
  modal.querySelector('h3')!.textContent = c ? 'ปรับปรุงรายละเอียดวิชาเรียน' : 'เปิดหลักสูตรวิชาเรียนใหม่';
  $('deleteCourse').hidden = !c;
  openModal(modal);
}

/** Request body for the course API from the modal form. */
function body() {
  const data = new FormData(form);
  const split = (name: string, sep: RegExp) => String(data.get(name)).split(sep).map((s) => s.trim()).filter(Boolean);
  return {
    ...Object.fromEntries(['title', 'subject', 'mode', 'rate', 'duration_hours', 'description'].map((k) => [k, data.get(k)])),
    active: field('active').checked,
    tags: [...data.getAll('level'), ...split('extraTags', /,/)],
    syllabus: split('syllabus', /\n/),
  };
}

const save = (c: Course | undefined, payload: object) =>
  c ? api(`/courses/${encodeURIComponent(c.code)}`, 'PUT', payload) : api(`/tutors/${tutorId}/courses`, 'POST', payload);

$('addCourse').onclick = () => open();
modal.querySelector<HTMLElement>('[data-close]')!.onclick = () => closeModal(modal);

list.onclick = async (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-edit],[data-toggle]');
  const c = courses.find((x) => x.code === (el?.dataset.edit ?? el?.dataset.toggle));
  if (!c) return;
  if (el!.dataset.edit) return open(c);
  try {
    await save(c, { ...c, active: !c.active });
    await reload();
  } catch (err) {
    fail(err);
  }
};

form.onsubmit = async (e) => {
  e.preventDefault();
  try {
    await save(editing, body());
    closeModal(modal);
    await reload();
    await notify('บันทึกรายละเอียดคอร์สเรียบร้อยแล้ว', 'บันทึกสำเร็จ');
  } catch (err) {
    fail(err);
  }
};

$('deleteCourse').onclick = async () => {
  if (!editing || !(await ask(`ลบคอร์ส "${editing.title}" และคำขอเรียนที่รออยู่ของคอร์สนี้ใช่หรือไม่?`, 'ลบคอร์สเรียน'))) return;
  try {
    await api(`/courses/${encodeURIComponent(editing.code)}`, 'DELETE');
    closeModal(modal);
    await reload();
  } catch (err) {
    fail(err);
  }
};
