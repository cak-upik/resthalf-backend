import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("commission_payout_requests")
export class CommissionPayoutRequest {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "staff_id" }) staffId: string;
  @Column({ name: "hotel_id" }) hotelId: string;
  @Column({
    name: "requested_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
  })
  requestedAmount: number;
  @Column({ name: "payout_method", default: "BANK_TRANSFER" })
  payoutMethod: string;
  @Column({ name: "account_details", type: "jsonb", nullable: true })
  accountDetails: Record<string, any>;
  @Column({ default: "PENDING" }) status: string;
  @Column({ name: "approved_by_staff_id", nullable: true })
  approvedByStaffId: string;
  @Column({ name: "approved_at", nullable: true, type: "timestamptz" })
  approvedAt: Date;
  @Column({ name: "paid_at", nullable: true, type: "timestamptz" })
  paidAt: Date;
  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejectionReason: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}
