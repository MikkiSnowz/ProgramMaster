export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escapes text for use inside innerHTML templates. */
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

export const baht = (n: number) => n.toLocaleString('th-TH');
export const hhmm = (t: string) => t.slice(0, 5);
export const thaiDate = (iso: string) =>
  new Date(`${iso}T00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export const openModal = (el: HTMLElement) => el.classList.add('active');
export const closeModal = (el: HTMLElement) => el.classList.remove('active');

/** Shows a system modal; resolves true when a [data-answer="yes"] button is clicked. */
function dialog(id: string, message: string, title: string) {
  const modal = $(id);
  modal.querySelector('h3')!.textContent = title;
  modal.querySelector('p')!.textContent = message;
  openModal(modal);
  return new Promise<boolean>((resolve) => {
    modal.onclick = (e) => {
      const answer = (e.target as HTMLElement).dataset.answer;
      if (!answer) return;
      closeModal(modal);
      resolve(answer === 'yes');
    };
  });
}

export const notify = (message: string, title = 'แจ้งเตือน') => dialog('alertModal', message, title);
export const ask = (message: string, title = 'ยืนยันการทำรายการ') => dialog('confirmModal', message, title);
export const fail = (err: unknown) => notify(err instanceof Error ? err.message : String(err), 'เกิดข้อผิดพลาด');
