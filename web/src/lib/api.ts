import { get } from 'svelte/store';
import { auth } from './stores/auth.ts';


export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const { token } = get(auth);
  const headers = new Headers(opts.headers || {});
  // JSON oletuksena
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  const url = path.startsWith('http') ? path : API_BASE + path;
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data?.error || data?.message || res.statusText) as string;
    throw new Error(msg);
  }
  return data as T;
}