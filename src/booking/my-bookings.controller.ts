import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Booking } from "./booking.entity";
import { DelegationRecord } from "../delegation/delegation.entity";
import { WholesaleBooking } from "../wholesale/wholesale-booking.entity";

@Controller("my")
@UseGuards(JwtAuthGuard)
export class MyBookingsController {
  constructor(
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    @InjectRepository(DelegationRecord)
    private delegations: Repository<DelegationRecord>,
    @InjectRepository(WholesaleBooking)
    private wholesale: Repository<WholesaleBooking>,
  ) {}

  @Get("bookings")
  async myBookings(@Request() req: any) {
    const guestId = req.user.id;
    // Direct bookings with delegation info
    const direct = await this.bookings
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.room", "r")
      .leftJoinAndSelect("r.hotel", "h")
      .where("b.guest_id = :guestId", { guestId })
      .orderBy("b.created_at", "DESC")
      .limit(20)
      .getMany();
    // Attach active delegation for each direct booking
    const directWithDelegation = await Promise.all(
      direct.map(async (b) => {
        const delegation = await this.delegations.findOne({
          where: { bookingId: b.id, status: "ACTIVE" },
        });
        return { ...b, delegation, _type: "DIRECT" };
      }),
    );
    // Wholesale bookings
    const ws = await this.wholesale.find({
      where: { guestId },
      order: { createdAt: "DESC" },
      take: 20,
    });
    const wholesaleFormatted = ws.map((w) => ({ ...w, _type: "WHOLESALE" }));
    return {
      direct: directWithDelegation,
      wholesale: wholesaleFormatted,
      total: direct.length + ws.length,
    };
  }
  
  @Get("stays/active")
  async activeStay(@Request() req: any) {
    const delegation = await this.delegations
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.room", "r")
      .leftJoinAndSelect("r.hotel", "h")
      .innerJoin("bookings", "b", "b.delegation_id = d.id")
      .where("b.guest_id = :id", { id: req.user.id })
      .andWhere("d.status = 'ACTIVE'")
      .andWhere("d.end_time > NOW()")
      .getOne();
    return delegation ?? null;
  }
}
