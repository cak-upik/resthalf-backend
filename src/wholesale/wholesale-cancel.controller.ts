import {
  Controller,
  Delete,
  Param,
  Request,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { WholesaleBooking } from "./wholesale-booking.entity";
import { TBOProvider } from "./providers/tbo.provider";
import { HotelbedsProvider } from "./providers/hotelbeds.provider";

@ApiTags("Bookings")
@ApiBearerAuth("access-token")
@Controller("bookings/wholesale")
@UseGuards(JwtAuthGuard)
export class WholesaleCancelController {
  constructor(
    @InjectRepository(WholesaleBooking)
    private repo: Repository<WholesaleBooking>,
    private tbo: TBOProvider,
    private hotelbeds: HotelbedsProvider,
  ) {}
  
  @ApiOperation({ summary: "Cancel a wholesale booking (supplier policy applies)" })
  @Delete(":id")
  async cancel(@Param("id") id: string, @Request() req: any) {
    const b = await this.repo.findOne({ where: { id, guestId: req.user.id } });
    if (!b) throw new BadRequestException("Booking not found");
    if (!b.isRefundable)
      throw new BadRequestException("Non-refundable booking");
    if (b.cancellationDeadline && new Date() > b.cancellationDeadline)
      throw new BadRequestException("Cancellation deadline passed");
    const provider = b.supplier === "TBO" ? this.tbo : this.hotelbeds;
    const result = await provider.cancel(b.supplierBookingRef);
    if (!result.success)
      throw new BadRequestException("Supplier cancellation failed");
    await this.repo.update(id, {
      status: "CANCELLED",
      cancelledAt: new Date(),
    });
    return {
      success: true,
      message: "Booking cancelled. Refund per supplier policy.",
    };
  }
}
