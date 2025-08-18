import { ReservationItem, Product, mergeDuplicateItems } from "../models/product.ts";
import { User, UserReservation, readUsers, writeUsers } from "../models/users.ts";

// Polut suhteessa TÄHÄN tiedostoon (controllers/)
const PRODUCTS_URL = new URL("../models/products.json", import.meta.url);

async function readJson<T>(url: URL): Promise<T> {
  const txt = await Deno.readTextFile(url);
  return JSON.parse(txt) as T;
}
async function writeJsonAtomic(url: URL, data: unknown) {
  const tmp = new URL(url.pathname + ".tmp", url);
  await Deno.writeTextFile(tmp, JSON.stringify(data, null, 2));
  await Deno.rename(tmp, url);
}

type PartialDetail = { productId: string; requested: number; reserved: number; missing: number };
type ReserveResult =
  | { ok: true; status: "full"; reservedAt: string; items: ReservationItem[]; message: string }
  | { ok: true; status: "partial"; reservedAt: string; items: ReservationItem[]; partials: PartialDetail[]; message: string }
  | { ok: false; error: string };

export async function listProducts(): Promise<Product[]> {
  return await readJson<Product[]>(PRODUCTS_URL);
}

export async function reserveProductsAsOneOperationFlexible(
  userId: string,
  rawItems: ReservationItem[]
): Promise<ReserveResult> {
  // 1) Yhdistä duplikaatit
  const items = mergeDuplicateItems(rawItems);

  // 2) Lataa tila
  const [products, users] = await Promise.all([
    readJson<Product[]>(PRODUCTS_URL),
    readUsers(),
  ]);

  const userIdx = users.findIndex((u) => u.username === userId);
  if (userIdx === -1) return { ok: false, error: "User not found" };

  type NormalizedProduct = Product & { maxPerUser: number };
  const productsById = new Map<string, NormalizedProduct>(
    products.map((p) => [
      p.id,
      {
        ...p,
        maxPerUser:
          Number.isInteger(p.maxPerUser) && (p.maxPerUser as number) >= 0 ? (p.maxPerUser as number) : 0,
      },
    ]),
  );

  // === UUSI OMINAISUUS: Poista edellinen varaus ja palauta tuotteet varastoon ===
  const user = users[userIdx];
  const prevReservations: UserReservation[] = user.reservations ?? [];

  // Poimitaan uusin (suurin reservedAt) varaus, jos sellainen on
  let latestIdx = -1;
  let latest: UserReservation | undefined;
  for (let i = 0; i < prevReservations.length; i++) {
    const r = prevReservations[i];
    if (!latest || new Date(r.reservedAt) > new Date(latest.reservedAt)) {
      latest = r;
      latestIdx = i;
    }
  }

  // Palauta edellisen varauksen tuotteet varastoon
  if (latest) {
    for (const it of latest.items) {
      const p = productsById.get(it.productId);
      if (p) p.available += it.quantity; // Kasvatetaan saatavuutta
      // Jos tuotetta ei löydy, ohitetaan hiljaisesti (voi logittaa jos haluat)
    }
  }

  // 3) Laske tämän pyynnön toteutettavat määrät (täysi/osittainen) palautetun varaston päältä
  const toReserve: ReservationItem[] = [];
  const partials: PartialDetail[] = [];

  for (const it of items) {
    const p = productsById.get(it.productId);
    if (!p) return { ok: false, error: `Product ${it.productId} not found` };

    const limit = p.maxPerUser;
    const alreadyReservedByUserForThisProduct = 0;

    const maxAllowedByLimit =
      limit === 0 ? it.quantity : Math.max(0, Math.min(it.quantity, limit - alreadyReservedByUserForThisProduct));

    const reserveQty = Math.min(maxAllowedByLimit, p.available);
    const missing = it.quantity - reserveQty;

    if (reserveQty > 0) {
      toReserve.push({ productId: it.productId, quantity: reserveQty });
    }
    if (missing > 0) {
      partials.push({
        productId: it.productId,
        requested: it.quantity,
        reserved: reserveQty,
        missing,
      });
    }
  }

  // 4) Päivitä varastot muistiin varattavien osalta
  for (const it of toReserve) {
    const p = productsById.get(it.productId)!;
    if (p) p.available -= it.quantity;
  }

  const now = new Date().toISOString();

  // 5) Päivitä käyttäjän varaukset:
  //    - Poista edellinen varaus (jos oli)
  //    - Lisää uusi varaus vain jos jotain saatiin varattua
  const nextReservations = prevReservations.slice();
  if (latestIdx !== -1) nextReservations.splice(latestIdx, 1);

  let newReservation: UserReservation | null = null;
  if (toReserve.length > 0) {
    newReservation = {
      reservedAt: now,
      items: toReserve.map((x) => ({ productId: x.productId, quantity: x.quantity })),
    };
    nextReservations.push(newReservation);
  }

  const updatedUsers: User[] = users.slice();
  updatedUsers[userIdx] = { ...user, reservations: nextReservations };

  // 6) Kirjoita atomisesti products + users
  const updatedProducts: Product[] = products.map((p) => {
    const np = productsById.get(p.id)!;
    // Palautetaan muoto Product: jos haluat säilyttää maxPerUser alkuperäisen arvon/puuttuvuuden,
    // käytetään np.maxPerUser (numero) sellaisenaan.
    return { ...p, available: np.available, maxPerUser: np.maxPerUser };
  });

  try {
    await writeJsonAtomic(PRODUCTS_URL, updatedProducts);
    await writeUsers(updatedUsers);
  } catch {
    return { ok: false, error: "Failed to persist reservation" };
  }

  // 7) Vastaukset (sama sopimus kuin aiemmin):
  if (toReserve.length === 0) {
    // HUOM: Tässä pisteessä edellinen varaus on poistettu ja varasto palautettu,
    // mutta uutta ei saatu tehtyä (ei ollut saatavuutta).
    return { ok: false, error: "No items available to reserve" };
  }

  if (partials.length === 0) {
    return {
      ok: true,
      status: "full",
      reservedAt: now,
      items: toReserve,
      message: "Products reserved successfully",
    };
  } else {
    return {
      ok: true,
      status: "partial",
      reservedAt: now,
      items: toReserve,
      partials,
      message: "Products reserved partially, because there weren't enough",
    };
  }
}
