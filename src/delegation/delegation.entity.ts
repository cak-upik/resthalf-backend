import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
export type DelegationStatus = "ACTIVE" | "RECONCILED" | "EXPIRED" | "VACATED";

@Entity("delegation_records")
export class DelegationRecord {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "room_id" }) roomId: string;
  @Column({ name: "booking_id", nullable: true }) bookingId: string;
  @Column({ name: "designated_entity_id" }) designatedEntityId: string;
  @Column({ name: "start_time", type: "timestamptz" }) startTime: Date;
  @Column({ name: "end_time", type: "timestamptz" }) endTime: Date;
  @Column({ default: "ACTIVE" }) status: DelegationStatus;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @Column({ name: "reconciled_at", nullable: true, type: "timestamptz" })
  reconciledAt: Date;
  @Column({ name: "vacated_at", nullable: true, type: "timestamptz" })
  vacatedAt: Date;
  @Column({ name: "expired_at", nullable: true, type: "timestamptz" })
  expiredAt: Date;
}
