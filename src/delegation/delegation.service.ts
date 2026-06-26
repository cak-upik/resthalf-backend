import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DelegationRecord } from "./delegation.entity";

@Injectable()
export class DelegationService {
  constructor(
    @InjectRepository(DelegationRecord)
    private repo: Repository<DelegationRecord>,
  ) {}

  async create(data: {
    roomId: string;
    bookingId?: string; // omitted for manual bookings (not a `bookings` row)
    guestId: string;
    startTime: Date;
    endTime: Date;
  }): Promise<DelegationRecord> {
    return this.repo.save(
      this.repo.create({
        roomId: data.roomId,
        bookingId: data.bookingId,
        designatedEntityId: data.guestId,
        startTime: data.startTime,
        endTime: data.endTime,
        status: "ACTIVE",
      }),
    );
  }

  async findActive(roomId: string): Promise<DelegationRecord[]> {
    return this.repo.find({ where: { roomId, status: "ACTIVE" } });
  }

  // Staff confirmed guest physically left — AFTER system recorded expiry
  async markVacated(id: string): Promise<void> {
    await this.repo.update(id, { status: "VACATED", vacatedAt: new Date() });
  }

  // System observed time expired — NOT a physical checkout
  async markExpired(id: string): Promise<void> {
    await this.repo.update(id, { status: "EXPIRED", expiredAt: new Date() });
  }

  async markReconciled(id: string): Promise<void> {
    await this.repo.update(id, {
      status: "RECONCILED",
      reconciledAt: new Date(),
    });
  }
}
