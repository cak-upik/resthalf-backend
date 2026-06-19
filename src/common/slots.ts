// Single source of truth for the Direct booking slot windows.
// Both search (availability) and booking (delegation interval) MUST use this,
// so a booked slot is exactly the interval that search checks for overlap.

export const DIRECT_SLOTS = {
  HALF_DAY: {
    label: "Half Day Stay",
    startH: 0,
    endH: 12,
    nextDay: false,
    exclusive: true,
  },
  FULL_DAY: {
    label: "Full Day Stay",
    startH: 12,
    endH: 12,
    nextDay: true,
    exclusive: false,
  },
} as const;

export type SlotType = keyof typeof DIRECT_SLOTS;

export const SLOT_TYPES = Object.keys(DIRECT_SLOTS) as SlotType[];

export function isSlotType(v: unknown): v is SlotType {
  return typeof v === "string" && v in DIRECT_SLOTS;
}

/**
 * Classify a real booked window into a slot, by duration.
 *
 * The booked start/end are the source of truth (stored on the booking and
 * delegation, recorded verbatim in the ledger, and used for the client
 * countdown). This only labels the window so search/pricing can reason about
 * it: <= 12h is a HALF_DAY, anything longer is a FULL_DAY — consistent with the
 * 12h/24h price tiers.
 */
export function classifySlot(startTime: Date, endTime: Date): SlotType {
  const hours = (endTime.getTime() - startTime.getTime()) / 3_600_000;
  return hours <= 12 ? "HALF_DAY" : "FULL_DAY";
}

/**
 * Resolve a slot's [startTime, endTime] for a given calendar day, in UTC.
 *
 * Deterministic regardless of server timezone: we take the YYYY-MM-DD part and
 * build the instants with Date.UTC (no local-tz `setHours` drift). `date` may be
 * a plain date ("2026-06-12") or a full ISO string — only the day is used.
 */
export function resolveSlotInterval(
  date: string,
  slotType: SlotType,
): { startTime: Date; endTime: Date } {
  const slot = DIRECT_SLOTS[slotType];
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const startTime = new Date(Date.UTC(y, m - 1, d, slot.startH, 0, 0, 0));
  const endTime = new Date(
    Date.UTC(y, m - 1, d + (slot.nextDay ? 1 : 0), slot.endH, 0, 0, 0),
  );
  return { startTime, endTime };
}
