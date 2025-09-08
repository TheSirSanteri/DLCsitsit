export type ReservationConfig = {
  reservationOpensAt: string | null;
  reservationClosesAt: string | null;
};

export async function readConfig(): Promise<ReservationConfig> {
  const opens = Deno.env.get("RESERVATION_OPENS_AT") ?? null;
  const closes = Deno.env.get("RESERVATION_CLOSES_AT") ?? null;
  return {
    reservationOpensAt: opens,
    reservationClosesAt: closes,
  };
}

function parseIsoToMs(iso: string | null, label: "reservationOpensAt" | "reservationClosesAt"): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    throw new Error(
      `Invalid ${label}. Use ISO8601 with timezone, e.g. 2025-09-01T18:00:00+03:00`
    );
  }
  return t;
}

export type ReservationWindowStatus = "before" | "open" | "closed";

export async function getReservationGate(nowMs = Date.now()): Promise<{
  canReserve: boolean;
  opensAt: string | null;
  closesAt: string | null;
  status: ReservationWindowStatus;
  now: string;
}> {
  const cfg = await readConfig();

  const opensMs = parseIsoToMs(cfg.reservationOpensAt, "reservationOpensAt") ?? 0; // null => heti auki
  const closesMs = parseIsoToMs(cfg.reservationClosesAt, "reservationClosesAt");   // null => ei koskaan sulkeudu

  // Varmiste: jos molemmat on asetettu ja avaus >= sulku -> virheellinen konfiguraatio
  if (closesMs !== null && opensMs >= closesMs) {
    throw new Error("reservationClosesAt must be after reservationOpensAt");
  }

  let status: ReservationWindowStatus;
  if (nowMs < opensMs) status = "before";
  else if (closesMs !== null && nowMs >= closesMs) status = "closed";
  else status = "open";

  return {
    canReserve: status === "open",
    opensAt: cfg.reservationOpensAt,
    closesAt: cfg.reservationClosesAt,
    status,
    now: new Date(nowMs).toISOString(),
  };
}
