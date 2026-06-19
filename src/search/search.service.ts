import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Room } from "../rooms/room.entity";
import { WholesaleService } from "../wholesale/wholesale.service";
import {
  DIRECT_SLOTS,
  SLOT_TYPES,
  resolveSlotInterval,
  type SlotType,
} from "../common/slots";

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    private wholesale: WholesaleService,
  ) {}

  async search(dto: {
    city: string;
    date: string;
    slotType?: SlotType;
    nights?: number;
    adults?: number;
    includeWholesale?: boolean;
  }) {
    // Both lanes run simultaneously
    const [direct, wholesale] = await Promise.all([
      this.searchDirect(dto),
      dto.includeWholesale !== false ? this.searchWholesale(dto) : [],
    ]);
    return {
      direct,
      wholesale,
      meta: { directCount: direct.length, wholesaleCount: wholesale.length },
    };
  }

  private async searchDirect(dto: {
    city: string;
    date: string;
    slotType?: SlotType;
  }) {
    const slots: SlotType[] = dto.slotType ? [dto.slotType] : SLOT_TYPES;
    const results: any[] = [];
    for (const slotType of slots) {
      const { startTime, endTime } = resolveSlotInterval(dto.date, slotType);
      const rooms = await this.roomRepo
        .createQueryBuilder("r")
        .innerJoinAndSelect("r.hotel", "h")
        .where("LOWER(h.city) = LOWER(:city)", { city: dto.city })
        .andWhere("r.is_ring_fenced = true")
        .andWhere("r.is_active = true")
        .getMany();
      for (const room of rooms) {
        const conflict = await this.roomRepo.query(
          `SELECT COUNT(*) FROM delegation_records
WHERE room_id=$1 AND status IN ('ACTIVE','EXPIRED')
AND start_time<$2 AND end_time>$3`,
          [room.id, endTime, startTime],
        );
        if (parseInt(conflict[0].count) > 0) continue;
        const hrs = (endTime.getTime() - startTime.getTime()) / 3600000;
        results.push({
          source: "RESTHALF_DIRECT",
          roomId: room.id,
          roomNumber: room.roomNumber,
          hotel: {
            id: room.hotel.id,
            name: room.hotel.name,
            city: room.hotel.city,
          },
          slotType,
          startTime,
          endTime,
          price: hrs <= 12 ? +room.basePriceH12 : +room.basePriceH24,
          currency: room.currency,
          label: DIRECT_SLOTS[slotType].label,
          badge: DIRECT_SLOTS[slotType].exclusive
            ? "RestHalf Exclusive"
            : "Time-Enforced",
        });
      }
    }
    return results;
  }

  private async searchWholesale(dto: any) {
    const nights = dto.nights ?? 1;
    const checkOut = this.addNights(dto.date, nights);
    const raw = await this.wholesale.search({
      city: dto.city,
      countryCode: "ID",
      checkIn: dto.date,
      checkOut,
      nights,
      adults: dto.adults ?? 1,
      currency: "IDR",
    });
    return raw.map((h) => ({
      source: "WHOLESALE",
      supplier: h.supplier,
      supplierRateKey: h.supplierRateKey,
      supplierHotelId: h.supplierHotelId,
      hotelName: h.hotelName,
      starRating: h.starRating,
      checkIn: dto.date,
      checkOut,
      nights,
      price: h.sellingRate,
      currency: h.currency,
      isRefundable: h.isRefundable,
      label: nights === 1 ? "1 Night" : `${nights} Nights`,
      badge: h.isRefundable ? "Free Cancellation" : undefined,
    }));
  }

  private addNights(date: string, nights: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + nights);
    return d.toISOString().split("T")[0];
  }
}
