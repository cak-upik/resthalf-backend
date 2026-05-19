import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("staff")
export class Staff {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "hotel_id" }) hotelId: string;
  @Column({ length: 200 }) name: string;
  @Column({ unique: true, nullable: true }) phone: string;
  @Column({ default: "receptionist" }) role: string;
  @Column({ name: "password_hash", nullable: true }) passwordHash: string;
  @Column({ name: "is_active", default: true }) isActive: boolean;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}
