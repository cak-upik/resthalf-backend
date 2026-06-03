import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { DelegationRecord } from "./delegation.entity";
import { LedgerService } from "../ledger/ledger.service";
import { WhatsAppService } from "../notifications/whatsapp.service";
import { DashboardGateway } from "../dashboard/dashboard.gateway";

@Injectable()
export class ExpiryWorker {
  private readonly logger = new Logger(ExpiryWorker.name);
  // Prevents duplicate ledger writes on each cron tick
  private processed = new Set<string>();
  constructor(
    @InjectRepository(DelegationRecord)
    private repo: Repository<DelegationRecord>,
    private ledger: LedgerService,
    private whatsapp: WhatsAppService,
    private gateway: DashboardGateway,
  ) {}

  @Cron("* * * * *") // every minute
  async observeAndRecord() {
    // ★ renamed: intent is observe, not enforce
    const now = new Date();
    const expired = await this.repo.find({
      where: { status: "ACTIVE", endTime: LessThan(now) },
    });
    for (const d of expired) {
      if (this.processed.has(d.id)) continue;
      // STEP 1: RECORD — time truth. Guest may still be present.
      await this.ledger.append({
        roomId: d.roomId,
        delegationId: d.id,
        eventType: "AUTHORITY_EXPIRED",
        eventData: {
          scheduledEnd: d.endTime,
          observedAt: now,
          physicalStatusUnknown: true, // explicit: we do not know
        },
        actor: "system",
      });
      // STEP 2: RELEASE — mark available in software for next guest
      await this.repo.update(d.id, {
        status: "EXPIRED",
        expiredAt: now,
      });
      // STEP 3: NOTIFY — alert staff who decide physical reality
      await this.notifyStaff(d);
      this.gateway.emitExpiry(d.roomId, d.id);
      this.processed.add(d.id);
      // NOTHING ELSE. No enforcement. Staff handles from here.
    }
  }

  @Cron("*/5 * * * *")
  async sendCheckoutReminders() {
    const in60 = new Date(Date.now() + 60 * 60 * 1000);
    const approaching = await this.repo
      .createQueryBuilder("d")
      .where("d.status = 'ACTIVE'")
      .andWhere("d.end_time <= :soon", { soon: in60 })
      .andWhere("d.end_time > :now", { now: new Date() })
      .getMany();
    for (const d of approaching) {
      const mins = Math.floor((d.endTime.getTime() - Date.now()) / 60000);
      if ([60, 30, 15].includes(mins))
        await this.whatsapp.sendCheckoutReminder(d.id, mins);
    }
  }
  
  private async notifyStaff(d: DelegationRecord) {
    const info = await this.repo.query(
      `
SELECT r.room_number, h.whatsapp_number FROM rooms r
JOIN hotels h ON h.id = r.hotel_id WHERE r.id = $1`,
      [d.roomId],
    );
    if (!info[0]) return;
    await this.whatsapp.sendRaw(
      info[0].whatsapp_number,
      `■ *Room ${info[0].room_number} – Authority Ended*\n\n
Please verify if guest has left.\n
Confirm in dashboard: Guest Left OR Still Present.`,
    );
  }
}
