import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Hotel } from "../hotels/hotel.entity";
import { Room } from "../rooms/room.entity";
import { Staff } from "../staff/staff.entity";

@Entity("manual_bookings")
export class ManualBooking {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "booking_reference", unique: true }) bookingReference: string;
  @Column({ name: "hotel_id" }) hotelId: string;
  @ManyToOne(() => Hotel) @JoinColumn({ name: "hotel_id" }) hotel: Hotel;
  @Column({ name: "room_id" }) roomId: string;
  @ManyToOne(() => Room) @JoinColumn({ name: "room_id" }) room: Room;
  @Column({ name: "delegation_id", nullable: true }) delegationId: string;
  @Column({ name: "guest_name" }) guestName: string;
  @Column({ name: "guest_phone", nullable: true }) guestPhone: string;
  @Column({ name: "guest_email", nullable: true }) guestEmail: string;
  @Column({ name: "created_by_staff_id" }) createdByStaffId: string;
  @ManyToOne(() => Staff)
  @JoinColumn({ name: "created_by_staff_id" })
  createdByStaff: Staff;
  @Column({ name: "start_time", type: "timestamptz" }) startTime: Date;
  @Column({ name: "end_time", type: "timestamptz" }) endTime: Date;
  @Column({ name: "slot_type" }) slotType: string;
  @Column({ name: "total_amount", type: "decimal", precision: 14, scale: 2 })
  totalAmount: number;
  @Column({ default: "IDR" }) currency: string;
  @Column({ name: "payment_method", default: "AT_HOTEL" })
  paymentMethod: string;
  @Column({ name: "payment_status", default: "PENDING" }) paymentStatus: string;
  @Column({ name: "payment_collected_by_staff_id", nullable: true })
  paymentCollectedByStaffId: string;
  @Column({ name: "payment_collected_at", nullable: true, type: "timestamptz" })
  paymentCollectedAt: Date;
  @Column({
    name: "commission_percent",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 10,
  })
  commissionPercent: number;
  // DB-generated STORED column — read-only in TypeORM
  @Column({
    name: "commission_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
    generatedType: "STORED",
    asExpression: "total_amount * commission_percent / 100",
    insert: false,
    update: false,
    nullable: true,
  })
  commissionAmount: number;
  @Column({ name: "commission_status", default: "PENDING" })
  commissionStatus: string;
  @Column({ default: "CONFIRMED" }) status: string;
  @Column({ type: "text", nullable: true }) notes: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt: Date;
}
