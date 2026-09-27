import { api, session } from '../lib/api';
import { $, ask, esc, fail, notify } from '../lib/ui';

type User = { id: string; name: string; avatar: string };

const select = $<HTMLSelectElement>('roleSelect');
$(session.role === 'tutor' ? 'navTutorDash' : 'navStudentDash').hidden = false;

const group = (role: string, label: string, users: User[]) =>
  `<optgroup label="${label}">${users.map((u) => `<option value="${role}:${esc(u.id)}">${esc(u.avatar)} ${esc(u.name)}</option>`).join('')}</optgroup>`;

api<{ tutors: User[]; students: User[] }>('/users').then(({ tutors, students }) => {
  select.innerHTML = group('student', 'บัญชีนักเรียน', students) + group('tutor', 'บัญชีติวเตอร์', tutors);
  select.value = `${session.role}:${session.id}`;
}, fail);

select.onchange = async () => {
  const [role, id] = select.value.split(':');
  session.set(role, id);
  await notify(`บทบาท: ${role === 'tutor' ? 'ติวเตอร์' : 'นักเรียน'}\nรหัสผู้ใช้: ${id}`, 'สลับผู้ใช้งานสำเร็จ');
  location.href = `/${role}/dashboard`;
};

$('resetDb').onclick = async () => {
  if (!(await ask('ล้างข้อมูลการจองทั้งหมดใน PostgreSQL และคืนค่าข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่?', 'กวาดล้างฐานข้อมูลระบบ'))) return;
  try {
    await api('/system/reset', 'POST');
    session.set('student', 'std-mintra'); // accounts created since the last reset are gone
    await notify('คืนค่าฐานข้อมูลเป็นข้อมูลตัวอย่างเรียบร้อยแล้ว', 'ทำความสะอาดคลังสำเร็จ');
    location.reload();
  } catch (err) {
    fail(err);
  }
};
