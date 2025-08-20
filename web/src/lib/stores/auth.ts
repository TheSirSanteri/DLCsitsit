import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type AuthState = {
  token: string | null;
  username: string | null;
};

const initial: AuthState = { token: null, username: null };

export const auth = writable<AuthState>(initial);

// Pysyvyys selaimessa
if (browser) {
  const saved = localStorage.getItem('auth');
  if (saved) {
    try {
      auth.set(JSON.parse(saved) as AuthState);
    } catch { /* ignore */ }
  }
  auth.subscribe((val) => {
    localStorage.setItem('auth', JSON.stringify(val));
  });
}