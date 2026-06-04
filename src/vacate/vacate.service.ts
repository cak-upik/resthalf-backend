import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DelegationRecord } from "../delegation/delegation.entity";
import { ReconciliationService } from "../delegation/reconciliation.service";
import { LedgerService } from "../ledger/ledger.service";

@Injectable()
export class VacateService {
  constructor(
    @InjectRepository(DelegationRecord)
    private repo: Repository<DelegationRecord>,
    private reconciliation: ReconciliationService,
    private ledger: LedgerService,
  ) {}
  
  async vacate(delegationId: string, guestId: string) {
    const d = await this.repo.findOne({
      where: { id: delegationId, status: "ACTIVE" },
    });
    if (!d) throw new BadRequestException("No active stay found");
    if (d.designatedEntityId !== guestId)
      throw new BadRequestException("Not authorised");
    const earlyMins = Math.max(
      0,
      Math.floor((d.endTime.getTime() - Date.now()) / 60000),
    );
    await this.repo.update(delegationId, {
      status: "VACATED",
      vacatedAt: new Date(),
    });
    await this.ledger.append({
      roomId: d.roomId,
      delegationId,
      eventType: "PHYSICAL_VACATE_CONFIRMED",
      eventData: {
        vacatedAt: new Date(),
        earlyByMinutes: earlyMins,
        vacatedByGuest: true,
      },
      actor: "guest",
    });
    await this.reconciliation.reconcile(delegationId, "guest");
    return {
      success: true,
      message: "Room released. Thank you for staying with RestHalf!",
      roomId: d.roomId,
      earlyByMinutes: earlyMins,
    };
  }
}
