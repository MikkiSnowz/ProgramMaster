const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Drives a MonthCalendar component: ◀ ▶ navigation plus one `cell(date)` HTML string per day.
 * Returns `render(jumpTo?)`: re-renders (call after data changes), optionally switching to jumpTo's month.
 */
export function mountCalendar(root: HTMLElement, cell: (d: Date) => string, noPast = false) {
  const [prev, label, next] = root.querySelectorAll<HTMLElement>('[data-nav]');
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);

  const render = (jumpTo?: Date) => {
    if (jumpTo) cursor.setFullYear(jumpTo.getFullYear(), jumpTo.getMonth(), 1);
    const y = cursor.getFullYear(), m = cursor.getMonth();
    label.textContent = cursor.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    prev.toggleAttribute('disabled', noPast && y === now.getFullYear() && m === now.getMonth());
    let html = '<div></div>'.repeat(cursor.getDay());
    for (let d = 1, last = new Date(y, m + 1, 0).getDate(); d <= last; d++) html += cell(new Date(y, m, d));
    grid.innerHTML = html;
  };
  prev.onclick = () => { cursor.setMonth(cursor.getMonth() - 1); render(); };
  next.onclick = () => { cursor.setMonth(cursor.getMonth() + 1); render(); };
  render();
  return render;
}
