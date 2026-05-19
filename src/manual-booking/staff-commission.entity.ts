import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Staff } from "../staff/staff.entity";
import { Hotel } from "../hotels/hotel.entity";

@Entity("staff_commission_accounts")
export class StaffCommissionAccount {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "staff_id" }) staffId: string;
  @ManyToOne(() => Staff) @JoinColumn({ name: "staff_id" }) staff: Staff;
  @Column({ name: "hotel_id" }) hotelId: string;
  @ManyToOne(() => Hotel) @JoinColumn({ name: "hotel_id" }) hotel: Hotel;
  @Column({
    name: "total_commission_earned",
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalCommissionEarned: number;
  @Column({
    name: "total_commission_paid",
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalCommissionPaid: number;
  @Column({
    name: "current_balance",
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  currentBalance: number;
  @Column({ name: "last_payout_date", nullable: true, type: "timestamptz" })
  lastPayoutDate: Date;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt: Date;
}
