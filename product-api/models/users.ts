import { supabase } from "./db.ts";

export type UserReservation = {
  reservedAt: string; // ISO for the whole operation
  items: Array<{ productId: string; quantity: number }>;
};

export type User = {
  username: string;
  name: string;
  email: string;
  password: string;
  reservations?: UserReservation[];    // reservation
};


export async function getUserReservations(username: string): Promise<UserReservation[]> {
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, reserved_at")
    .eq("username", username)
    .order("reserved_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!reservations || reservations.length === 0) return [];

  const ids = reservations.map((r) => r.id);
  const { data: items, error: itemsErr } = await supabase
    .from("reservation_items")
    .select("reservation_id, product_id, quantity")
    .in("reservation_id", ids);

  if (itemsErr) throw new Error(itemsErr.message);

  const byRes = new Map<string, Array<{ productId: string; quantity: number }>>();
  for (const it of items ?? []) {
    const arr = byRes.get(it.reservation_id) ?? [];
    arr.push({ productId: it.product_id, quantity: it.quantity });
    byRes.set(it.reservation_id, arr);
  }

  return reservations.map((r) => ({
    reservedAt: r.reserved_at,
    items: byRes.get(r.id) ?? [],
  }));
}
