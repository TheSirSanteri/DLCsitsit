// models/config.ts
export type ReservationConfig = {
  reservationOpensAt: string | null;
};

const CONFIG_URL = new URL("./config.json", import.meta.url);

async function readJson<T>(url: URL): Promise<T> {
  const txt = await Deno.readTextFile(url);
  return JSON.parse(txt) as T;
}
async function writeJsonAtomic(url: URL, data: unknown) {
  const tmp = new URL(url.pathname + ".tmp", url);
  await Deno.writeTextFile(tmp, JSON.stringify(data, null, 2));
  await Deno.rename(tmp, url);
}

export async function readConfig(): Promise<ReservationConfig> {
  try {
    const cfg = await readJson<ReservationConfig>(CONFIG_URL);
    return {
      reservationOpensAt:
        typeof cfg?.reservationOpensAt === "string" || cfg?.reservationOpensAt === null
          ? cfg.reservationOpensAt
          : null,
    };
  } catch {
    // Jos tiedostoa ei ole → oletus: avattu (null = ei porttia)
    return { reservationOpensAt: null };
  }
}

export async function writeConfig(cfg: ReservationConfig): Promise<void> {
  await writeJsonAtomic(CONFIG_URL, cfg);
}

function parseOpensAtToMs(iso: string | null): number {
  if (!iso) return 0; // null → heti auki
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    throw new Error(
      "Invalid reservationOpensAt. Use ISO8601 with timezone, e.g. 2025-09-01T18:00:00+03:00"
    );
  }
  return t;
}

export async function getReservationGate(nowMs = Date.now()): Promise<{
  canReserve: boolean;
  opensAt: string | null;
  now: string;
}> {
  const cfg = await readConfig();
  const opensMs = parseOpensAtToMs(cfg.reservationOpensAt);
  return {
    canReserve: nowMs >= opensMs,
    opensAt: cfg.reservationOpensAt,
    now: new Date(nowMs).toISOString(),
  };
}
