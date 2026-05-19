import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("wholesale_bookings")
export class WholesaleBooking {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "guest_id", nullable: true }) guestId: string;
  @Column() supplier: string; // TBO | HOTELBEDS | RATEHAWK
  @Column({ name: "supplier_hotel_id" }) supplierHotelId: string;
  @Column({ name: "supplier_booking_ref", nullable: true })
  supplierBookingRef: string;
  @Column({ name: "supplier_rate_key", nullable: true })
  supplierRateKey: string;
  @Column({ name: "hotel_name", nullable: true }) hotelName: string;
  @Column({ name: "hotel_city", nullable: true }) hotelCity: string;
  @Column({ name: "hotel_star_rating", nullable: true })
  hotelStarRating: number;
  @Column({ name: "check_in", type: "date" }) checkIn: string;
  @Column({ name: "check_out", type: "date" }) checkOut: string;
  @Column({ type: "int" }) nights: number;
  @Column({ default: 1 }) adults: number;
  @Column({
    name: "supplier_net_rate",
    type: "decimal",
    precision: 14,
    scale: 2,
    nullable: true,
  })
  supplierNetRate: number;
  @Column({
    name: "guest_selling_rate",
    type: "decimal",
    precision: 14,
    scale: 2,
    nullable: true,
  })
  guestSellingRate: number;
  @Column({
    name: "markup_percent",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  markupPercent: number;
  @Column({ default: "IDR" }) currency: string;
  @Column({ name: "payment_status", default: "PENDING" }) paymentStatus: string;
  @Column({ name: "midtrans_order_id", nullable: true, unique: true })
  midtransOrderId: string;
  @Column({ name: "is_refundable", default: false }) isRefundable: boolean;
  @Column({
    name: "cancellation_deadline",
    nullable: true,
    type: "timestamptz",
  })
  cancellationDeadline: Date;
  @Column({ name: "cancellation_policy", type: "text", nullable: true })
  cancellationPolicy: string;
  @Column({ default: "PENDING" }) status: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @Column({ name: "confirmed_at", nullable: true, type: "timestamptz" })
  confirmedAt: Date;
  @Column({ name: "cancelled_at", nullable: true, type: "timestamptz" })
  cancelledAt: Date;
}
