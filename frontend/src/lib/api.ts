/** Calls the Express API (same origin: proxied by nginx in Docker, by Vite in `astro dev`). */
export async function api<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!json.success) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data;
}

/** Sandbox "login": the role switcher in the navbar stores who you are. */
export const session = {
  get role() { return localStorage.getItem('userRole') ?? 'student'; },
  get id() { return localStorage.getItem('userId') ?? 'std-mintra'; },
  set(role: string, id: string) {
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', id);
  },
};
