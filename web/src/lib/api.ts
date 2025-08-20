import { get } from 'svelte/store';
import { auth } from '$lib/stores/auth';

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const { token } = get(auth);
  const headers = new Headers(opts.headers || {});
  // JSON oletuksena
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data?.error || data?.message || res.statusText) as string;
    throw new Error(msg);
  }
  return data as T;
}