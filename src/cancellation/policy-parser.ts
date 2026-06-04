import { CancellationPolicy } from "./cancellation.types";
/**
 * Parses the raw supplier cancellationPolicy string into a structured policy.
 * Hotelbeds returns: "NON REFUNDABLE" or "REFUNDABLE UNTIL 2026-05-10"
 * TBO returns: "Free cancellation until 2026-05-10T23:59:00" or "Non-refundable"
 */
export function parseSupplierPolicy(
  raw: string | null,
  deadline: Date | null,
  isRefundable: boolean,
): CancellationPolicy {
  // Non-refundable — no amount returned regardless of timing
  if (!isRefundable || raw?.toLowerCase().includes("non")) {
    return {
      type: "NON_REFUNDABLE",
      deadline: null,
      refundPercent: 0,
      rawPolicy: raw ?? undefined,
    };
  }
  // Free cancellation with a deadline
  if (deadline) {
    return {
      type: "FREE_CANCELLATION",
      deadline,
      refundPercent: 100,
      rawPolicy: raw ?? undefined,
    };
  }
  // Refundable but no deadline info — treat as free cancellation
  return {
    type: "FREE_CANCELLATION",
    deadline: null,
    refundPercent: 100,
    rawPolicy: raw ?? undefined,
  };
}
export function calcDirectPolicy(startTime: Date): CancellationPolicy {
  const hoursUntilStart = (startTime.getTime() - Date.now()) / 3600000;
  if (hoursUntilStart <= 0) {
    return { type: "NON_REFUNDABLE", deadline: null, refundPercent: 0 };
  }
  const deadline = new Date(startTime.getTime() - 2 * 3600000); // 2h before start
  if (hoursUntilStart > 2) {
    return { type: "FREE_CANCELLATION", deadline, refundPercent: 100 };
  }
  return { type: "PARTIAL", deadline, refundPercent: 50 };
}
