import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Hotel } from "@/hotels/hotel.entity";

@Entity("rooms")
export class Room {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "hotel_id" }) hotelId: string;
  @ManyToOne(() => Hotel, (h) => h.rooms)
  @JoinColumn({ name: "hotel_id" })
  hotel: Hotel;
  @Column({ name: "room_number", length: 20 }) roomNumber: string;
  @Column({ name: "room_type", nullable: true }) roomType: string;
  @Column({ nullable: true }) floor: number;
  @Column({ name: "base_price_12h", type: "decimal", precision: 14, scale: 2 })
  basePriceH12: number;
  @Column({ name: "base_price_24h", type: "decimal", precision: 14, scale: 2 })
  basePriceH24: number;
  @Column({ default: "IDR" }) currency: string;
  @Column({ name: "is_ring_fenced", default: true }) isRingFenced: boolean;
  @Column({ name: "is_active", default: true }) isActive: boolean;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}
