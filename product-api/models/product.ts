export interface Product {
  id: string;
  name: string;
  available: number;
  maxPerUser: number; // optional, 0 => infinite
  price: number;
  info: string;
};

export interface ReservationItem {
  productId: string | number;
  quantity: number;
};


export function isReservationArray(body: unknown): body is ReservationItem[] {
  return Array.isArray(body) && body.every(
    it =>
      it &&
      typeof (it as any).productId === "string" &&
      typeof (it as any).quantity === "number" &&
      Number.isInteger((it as any).quantity) &&
      (it as any).quantity > 0
  );
}

/* Yhdistää duplikaatit: [{1,2},{1,3}] -> [{1,5}] */
export function mergeDuplicateItems(items: ReservationItem[]): ReservationItem[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const key = String(it.productId); // <-- castaa avain aina stringiksi
    map.set(key, (map.get(key) ?? 0) + it.quantity);
  }
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}
