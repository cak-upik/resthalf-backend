import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "room_id" }) roomId: string;
  @Column({ name: "guest_id" }) guestId: string;
  @Column({ name: "slot_type" }) slotType: string; // HALF_DAY | FULL_DAY
  @Column({ name: "start_time", type: "timestamptz" }) startTime: Date;
  @Column({ name: "end_time", type: "timestamptz" }) endTime: Date;
  @Column({ name: "total_price", type: "decimal", precision: 14, scale: 2 })
  totalPrice: number;
  @Column({ default: "IDR" }) currency: string;
  @Column({ default: "PENDING" }) status: string; // PENDING|CONFIRMED|COMPLETED|CANCELLED
  @Column({ name: "midtrans_order_id", nullable: true, unique: true })
  midtransOrderId: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}
