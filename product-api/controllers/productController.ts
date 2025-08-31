import { Product, ReservationItem, mergeDuplicateItems } from "../models/product.ts";
import { supabase } from "../models/db.ts";


export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, available, max_per_user, price, info")
    .order("id");

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    available: p.available,
    maxPerUser: p.max_per_user ?? 0,
    price: Number(p.price),
    info: p.info ?? "",
  }));
}

type PartialDetail = { productId: string; requested: number; reserved: number; missing: number };
type ReserveResult =
  | { ok: true; status: "full"; reservedAt: string; items: ReservationItem[]; message: string }
  | { ok: true; status: "partial"; reservedAt: string; items: ReservationItem[]; partials: PartialDetail[]; message: string }
  | { ok: false; error: string };

export async function reserveProductsAsOneOperationFlexible(
  userId: string,
  rawItems: ReservationItem[],
): Promise<ReserveResult> {
  const items = mergeDuplicateItems(rawItems);

  // RPC palauttaa rakenteen, jonka mapataan suoraan ReserveResultiin
  const { data, error } = await supabase.rpc("reserve_flexible", {
    p_username: userId,
    p_items: items as unknown as Record<string, unknown>[],
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Odotettu muoto SQL:stä:
  // {
  //   status: "full" | "partial",
  //   reserved_at: string,
  //   items: Array<{productId, quantity}>,
  //   partials: Array<{productId, requested, reserved, missing}>
  // }
  if (!data) return { ok: false, error: "No response from database" };

  const now = data.reserved_at as string;
  const itemsOut: ReservationItem[] = (data.items ?? []).map((i: any) => ({
    productId: String(i.productId),
    quantity: Number(i.quantity),
  }));

  if (data.status === "full") {
    return {
      ok: true,
      status: "full",
      reservedAt: now,
      items: itemsOut,
      message: "Products reserved successfully",
    };
  } else {
    const partialsOut: PartialDetail[] = (data.partials ?? []).map((p: any) => ({
      productId: String(p.productId),
      requested: Number(p.requested),
      reserved: Number(p.reserved),
      missing: Number(p.missing),
    }));
    // Jos ei saatu mitään, muunna virheeksi kuten aiemmin
    if (itemsOut.length === 0) {
      return { ok: false, error: "No items available to reserve" };
    }
    return {
      ok: true,
      status: "partial",
      reservedAt: now,
      items: itemsOut,
      partials: partialsOut,
      message: "Products reserved partially, because there weren't enough",
    };
  }
}