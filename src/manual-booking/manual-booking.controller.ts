import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { ManualBookingService } from "./manual-booking.service";

@Controller("manual-bookings")
@UseGuards(StaffAuthGuard)
export class ManualBookingController {
  constructor(private svc: ManualBookingService) {}

  // POST /manual-bookings — receptionist creates walk-in booking
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.svc.create({
      hotelId: req.staff.hotelId,
      roomId: body.roomId,
      staffId: req.staff.id,
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      guestEmail: body.guestEmail,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      slotType: body.slotType,
      totalAmount: +body.totalAmount,
      paymentMethod: body.paymentMethod ?? "AT_HOTEL",
      commissionPercent: body.commissionPercent ?? 10,
      notes: body.notes,
    });
  }

  // GET /manual-bookings — today's walk-in bookings for this hotel
  @Get()
  list(@Request() req: any) {
    return this.svc.listForHotel(req.staff.hotelId);
  }

  // POST /manual-bookings/:id/collect-payment — AT_HOTEL: guest pays now
  @Post(":id/collect-payment")
  collectPayment(@Param("id") id: string, @Request() req: any) {
    return this.svc.recordPayment(id, req.staff.id);
  }
  
  // POST /manual-bookings/:id/approve-commission — manager approves commission
  @Post(":id/approve-commission")
  approveCommission(@Param("id") id: string) {
    return this.svc.approveCommission(id);
  }
}
