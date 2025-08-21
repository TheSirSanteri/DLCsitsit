import { writable } from 'svelte/store';

export type Notice = {
  id: number;
  kind?: 'error' | 'success' | 'info';
  text: string;
  timeout?: number; // ms; 0 = ei auto-sulkeutumista
};

function createNotices() {
  const { subscribe, update } = writable<Notice[]>([]);
  let id = 0;

  function push(text: string, kind: Notice['kind'] = 'info', timeout = 4000) {
    const n: Notice = { id: ++id, text, kind, timeout };
    update((list) => [...list, n]);
    if (timeout > 0) {
      setTimeout(() => remove(n.id), timeout);
    }
    return n.id;
  }

  function remove(id: number) {
    update((list) => list.filter((n) => n.id !== id));
  }

  return { subscribe, push, remove };
}

export const notices = createNotices();
export const notify = {
  error: (t: string, timeout = 6000) => notices.push(t, 'error', timeout),
  success: (t: string, timeout = 3000) => notices.push(t, 'success', timeout),
  info: (t: string, timeout = 3000) => notices.push(t, 'info', timeout),
};
