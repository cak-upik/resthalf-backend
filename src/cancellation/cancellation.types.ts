export type PolicyType =
  | "NON_REFUNDABLE"
  | "FREE_CANCELLATION"
  | "PARTIAL"
  | "CUSTOM";
export type BookingType = "DIRECT" | "WHOLESALE" | "MANUAL";
export interface CancellationPolicy {
  type: PolicyType;
  deadline: Date | null; // null = no deadline (always applies)
  refundPercent: number; // 0-100 if applicable before deadline
  rawPolicy?: string; // Original supplier text for display
}
export interface RefundCalculation {
  allowed: boolean;
  policyType: PolicyType;
  originalAmount: number;
  refundAmount: number; // 0 if NON_REFUNDABLE or past deadline
  refundPercent: number;
  reason: string;
  deadlinePassed: boolean;
}
// DIRECT BOOKING POLICY
// Fixed rules — not supplier-dependent
export const DIRECT_CANCELLATION_RULES = {
  FREE_WINDOW_HOURS: 2, // Full refund if cancelled > 2h before start
  PARTIAL_PERCENT: 50, // 50% refund if cancelled within 2h window
  NO_REFUND_AFTER_START: true, // 0% if booking already started
} as const;
