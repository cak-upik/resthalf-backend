import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type LedgerEvent =
  // Time truth events (system writes automatically)
  | "AUTHORITY_ISSUED" // delegation created after payment
  | "AUTHORITY_EXPIRED" // time window ended in software
  // NOTE: does NOT mean guest left. Staff confirms that separately.
  // Human action events (staff writes via dashboard) ★ v2.0
  | "PHYSICAL_VACATE_CONFIRMED" // staff confirmed guest left
  | "OVERSTAY_RECORDED" // staff recorded guest still present
  | "MANUAL_CHECKOUT" // staff manual checkout
  | "STAFF_NOTIFIED" // WhatsApp alert sent
  | "GUEST_REMINDED" // guest reminder sent
  // Payment events
  | "PAYMENT_CAPTURED"
  | "PAYMENT_REFUNDED"
  // PSM/PEL events
  | "PSM_ADMITTED"
  | "PSM_REJECTED"
  | "EXECUTION_PATH_TERMINATED"
  // Operations
  | "CLEANING_NOTIFIED"
  | "CLEANING_CONFIRMED"
  | "STOP_SELL_SENT"
  | "STOP_SELL_RELEASED";
// FORBIDDEN: FORCED_CHECKOUT | PENALTY_APPLIED | GUEST_REMOVED

@Entity("temporal_ledger")
export class TemporalLedger {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: "room_id", nullable: true }) roomId: string;
  @Column({ name: "booking_id", nullable: true }) bookingId: string;
  @Column({ name: "delegation_id", nullable: true }) delegationId: string;
  @Column({ name: "event_type" }) eventType: LedgerEvent;
  @Column({ type: "jsonb", nullable: true }) eventData: any;
  @Column({ nullable: true }) actor: string;
  @CreateDateColumn() timestamp: Date;
}
