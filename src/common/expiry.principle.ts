/** RESTHALF EXPIRY PRINCIPLE — v2.0
 *
 * When ANY booking ends (Direct or Wholesale), backend does:
 * 1. RECORD → Append event to ledger
 * 2. RELEASE → Mark room available in software
 * 3. NOTIFY → Alert staff via WhatsApp + dashboard
 *
 * NEVER: force guest out, lock door, apply penalty, take physical action
 */
export const EXPIRY_ACTIONS = {
  RECORD: "Append to ledger",
  RELEASE: "Mark available in software",
  NOTIFY: "Alert human via WhatsApp + Dashboard",
} as const;
export const EXPIRY_NON_ACTIONS = {
  NO_PENALTY: "No automatic penalty",
  NO_PHYSICAL: "No physical enforcement",
  NO_FORCED_CHECKOUT: "No forced guest removal",
  NO_LOCKOUT: "No access blocking",
} as const;
