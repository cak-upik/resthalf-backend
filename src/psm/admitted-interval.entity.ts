import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";

@Entity("admitted_intervals")
export class AdmittedInterval {
  @PrimaryColumn("uuid") id: string;
  @Column({ name: "room_id", type: "uuid" }) roomId: string;
  @Column({ name: "delegation_id", type: "uuid" }) delegationId: string;
  @Column({ name: "start_time", type: "timestamptz" }) startTime: Date;
  @Column({ name: "end_time", type: "timestamptz" }) endTime: Date;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}
