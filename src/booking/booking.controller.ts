import { Controller, Post, Body, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { BookingService } from "./booking.service";
import { WholesaleBookingService } from "../wholesale/wholesale-booking.service";

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private bookingService: BookingService,
    private wholesaleBooking: WholesaleBookingService,
  ) {}

  // LANE 1: Direct — PEL > Redis > Ledger > Authority
  @Post("direct")
  async createDirect(@Body() body: any, @Request() req: any) {
    return this.bookingService.createBooking({
      roomId: body.roomId,
      guestId: req.user.id,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      slotType: body.slotType,
    });
  }
  
  // LANE 2: Wholesale — Supplier API only. No PEL. No Redis.
  @Post("wholesale")
  async createWholesale(@Body() body: any, @Request() req: any) {
    return this.wholesaleBooking.initiate({ ...body, guestId: req.user.id });
  }
}
