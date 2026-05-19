import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Room } from "@/rooms/room.entity";

@Entity("hotels")
export class Hotel {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ length: 200 }) name: string;
  @Column({ nullable: true }) city: string;
  @Column({ name: "country_code", default: "ID" }) countryCode: string;
  @Column({ nullable: true }) address: string;
  @Column({ name: "star_rating", default: 3 }) starRating: number;
  @Column({ name: "whatsapp_number", nullable: true }) whatsappNumber: string;
  @Column({ name: "channex_property_id", nullable: true })
  channexPropertyId: string;
  @Column({ name: "pms_type", default: "manual" }) pmsType: string;
  @Column({ name: "is_active", default: true }) isActive: boolean;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @OneToMany(() => Room, (r) => r.hotel) rooms: Room[];
}
