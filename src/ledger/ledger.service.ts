import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TemporalLedger, LedgerEvent } from "./temporal-ledger.entity";

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(TemporalLedger)
    private repo: Repository<TemporalLedger>,
  ) {}

  // Only way to write to this table — NEVER update or delete
  async append(entry: {
    roomId?: string;
    bookingId?: string;
    delegationId?: string;
    eventType: LedgerEvent;
    eventData?: any;
    actor: string;
  }): Promise<TemporalLedger> {
    return this.repo.save(
      this.repo.create({
        ...entry,
        timestamp: new Date(),
      }),
    );
  }

  async getAuditTrail(roomId: string): Promise<TemporalLedger[]> {
    return this.repo.find({
      where: { roomId },
      order: { timestamp: "DESC" },
      take: 200,
    });
  }
}
