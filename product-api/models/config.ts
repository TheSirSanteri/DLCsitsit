export type ReservationConfig = {
  reservationOpensAt: string | null;
};

export async function readConfig(): Promise<ReservationConfig> {
  const val = await Deno.env.get("RESERVATION_OPENS_AT") ?? null;
  return { reservationOpensAt: val };
}

export function writeConfig(_cfg: ReservationConfig): Promise<void> {
  // Ei tueta envin kirjoitusta Deployssa
  throw new Error("Writing config not supported in this environment");
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
