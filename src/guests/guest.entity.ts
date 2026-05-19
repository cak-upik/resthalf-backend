import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("guests")
export class Guest {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "full_name", length: 200 }) fullName: string;
  @Column({ unique: true, length: 20 }) phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ name: "id_number", nullable: true }) idNumber: string;
  @Column({ name: "password_hash", nullable: true }) passwordHash: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}
