import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Room } from "../rooms/room.entity";
import { DelegationRecord } from "../delegation/delegation.entity";
import { LedgerService } from "../ledger/ledger.service";
import { WhatsAppService } from "../notifications/whatsapp.service";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(DelegationRecord)
    private delegations: Repository<DelegationRecord>,
    private ledger: LedgerService,
    private whatsapp: WhatsAppService,
  ) {}

  async getLiveRoomStatus(hotelId: string) {
    const rooms = await this.rooms.find({
      where: { hotelId, isActive: true },
      relations: ["hotel"],
    });
    const results = [];
    for (const room of rooms) {
      const active = await this.delegations.findOne({
        where: { roomId: room.id, status: "ACTIVE" },
      });
      const expired = await this.delegations.findOne({
        where: { roomId: room.id, status: "EXPIRED" },
      });
      results.push({
        ...room,
        currentStatus: active
          ? "OCCUPIED"
          : expired
            ? "NEEDS_CONFIRMATION"
            : "AVAILABLE",
        activeDelegation: active,
        expiredDelegation: expired,
        timeLeft: active
          ? Math.floor((active.endTime.getTime() - Date.now()) / 1000)
          : null,
      });
    }
    return results;
  }

  async getTodayCheckins(hotelId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return this.delegations
      .createQueryBuilder("d")
      .innerJoin("d.room", "r")
      .where("r.hotel_id = :hotelId", { hotelId })
      .andWhere("d.start_time >= :today", { today })
      .andWhere("d.start_time < :tomorrow", { tomorrow })
      .getMany();
  }

  async getRevenueSummary(hotelId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.rooms.query(
      `
SELECT DATE(b.created_at) as date, SUM(b.total_price) as revenue,
COUNT(*) as bookings
FROM bookings b JOIN rooms r ON r.id = b.room_id
WHERE r.hotel_id = $1 AND b.created_at >= $2
AND b.status = 'CONFIRMED'
GROUP BY DATE(b.created_at)
ORDER BY date DESC`,
      [hotelId, since],
    );
  }

  async getRoomTimeline(roomId: string) {
    return this.ledger.getAuditTrail(roomId);
  }

  async confirmPhysicalVacate(
    roomId: string,
    delegationId: string,
    staffId: string,
    notes?: string,
  ) {
    await this.ledger.append({
      roomId,
      delegationId,
      eventType: "PHYSICAL_VACATE_CONFIRMED",
      eventData: { confirmedBy: staffId, confirmedAt: new Date(), notes },
      actor: "staff",
    });
    await this.whatsapp.sendCleaningAlert({
      roomNumber: roomId,
      hotelWhatsapp: "TODO",
    });
    return { success: true };
  }
  
  async markOverstay(
    roomId: string,
    delegationId: string,
    staffId: string,
    reason?: string,
  ) {
    await this.ledger.append({
      roomId,
      delegationId,
      eventType: "OVERSTAY_RECORDED",
      eventData: {
        recordedBy: staffId,
        reason: reason ?? "Guest present after authority",
      },
      actor: "staff",
    });
    return { success: true, message: "Recorded. Room management is yours." };
  }
}
