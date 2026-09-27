import { api } from '../../lib/api';
import { $, esc, fail, hhmm, notify, thaiDate } from '../../lib/ui';

type Request = { id: number; student_name: string; course_title: string; booking_date: string; start_time: string; end_time: string; notes: string };

const box = $('requests');
let reload = async () => {};

const item = (r: Request) => `
  <div class="flex flex-col gap-3 rounded-lg border border-line bg-paper/60 p-4">
    <div>
      <h4 class="font-semibold">${esc(r.student_name)}</h4>
      <p class="text-sm text-muted">${esc(r.course_title)}</p>
      <p class="mt-1 text-sm font-medium">${thaiDate(r.booking_date)} · ${hhmm(r.start_time)}–${hhmm(r.end_time)}</p>
    </div>
    ${r.notes ? `<p class="border-l-2 border-line pl-3 text-sm text-muted">“${esc(r.notes)}”</p>` : ''}
    <div class="flex gap-2 *:flex-1">
      <button type="button" class="btn-primary py-2" data-id="${r.id}" data-status="approved">ยืนยันคลาส</button>
      <button type="button" class="btn-muted py-2" data-id="${r.id}" data-status="rejected">ปฏิเสธ</button>
    </div>
  </div>`;

export function renderRequests(list: Request[], onChange: () => Promise<void>) {
  reload = onChange;
  box.innerHTML = list.map(item).join('') || '<p class="muted text-sm">ไม่มีคำขอใหม่</p>';
}

box.onclick = async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-status]');
  if (!btn) return;
  btn.disabled = true;
  const approved = btn.dataset.status === 'approved';
  try {
    await api(`/bookings/${btn.dataset.id}/status`, 'PATCH', { status: btn.dataset.status });
    await notify(approved ? 'ยืนยันคลาสแล้ว คลาสนี้จะแสดงในตารางสอนของคุณ' : 'ปฏิเสธคำขอแล้ว', approved ? 'ยืนยันคลาสสำเร็จ' : 'ปฏิเสธคำขอแล้ว');
    await reload();
  } catch (err) {
    btn.disabled = false;
    fail(err);
  }
};
