import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { DelegationRecord } from "./delegation.entity";
import { LedgerService } from "../ledger/ledger.service";
import { PSMEngine } from "../psm/psm.engine";

// Patent Section 4.3 — Single atomic idempotent write
@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(DelegationRecord)
    private repo: Repository<DelegationRecord>,
    private psm: PSMEngine,
    private ds: DataSource,
  ) {}

  // Called on guest checkout (vacate) — not on expiry
  async reconcile(delegationId: string, actor: string): Promise<void> {
    const d = await this.repo.findOne({ where: { id: delegationId } });
    if (!d || d.status === "RECONCILED") return; // idempotent
    await this.ds.transaction(async (em) => {
      await em.update(DelegationRecord, delegationId, {
        status: "RECONCILED",
        reconciledAt: new Date(),
      });
    });
    this.psm.evict(d.roomId, delegationId);
    await this.ledger.append({
      roomId: d.roomId,
      delegationId,
      eventType: "AUTHORITY_EXPIRED", // time truth still recorded
      eventData: { reconciledAt: new Date(), actor },
      actor,
    });
  }
}