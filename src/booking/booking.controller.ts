import { Controller, Post, Body, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { BookingService } from "./booking.service";
import { WholesaleBookingService } from "../wholesale/wholesale-booking.service";
import { CreateDirectBookingDto } from "./dto/create-direct-booking.dto";
import { CreateWholesaleBookingDto } from "./dto/create-wholesale-booking.dto";

@ApiTags("Bookings")
@ApiBearerAuth("access-token")
@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private bookingService: BookingService,
    private wholesaleBooking: WholesaleBookingService,
  ) {}

  // LANE 1: Direct — PEL > Redis > Ledger > Authority
  @ApiOperation({ summary: "Create a direct booking (Lane 1)" })
  @Post("direct")
  async createDirect(
    @Body() body: CreateDirectBookingDto,
    @Request() req: any,
  ) {
    return this.bookingService.createBooking({
      roomId: body.roomId,
      guestId: req.user.id,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      slotType: body.slotType,
    });
  }
  
  // LANE 2: Wholesale — Supplier API only. No PEL. No Redis.
  @ApiOperation({ summary: "Create a wholesale booking (Lane 2)" })
  @Post("wholesale")
  async createWholesale(
    @Body() body: CreateWholesaleBookingDto,
    @Request() req: any,
  ) {
    return this.wholesaleBooking.initiate({ ...body, guestId: req.user.id });
  }
}
