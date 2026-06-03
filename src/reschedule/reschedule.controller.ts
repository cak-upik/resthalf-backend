import { JwtAuthGuard } from "@/auth/jwt.guard";
import {
  Controller,
  UseGuards,
  Post,
  Param,
  Body,
  Request,
} from "@nestjs/common";
import { RescheduleService } from "./reschedule.service";

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class RescheduleController {
  constructor(private svc: RescheduleService) {}

  // POST /bookings/:bookingId/reschedule
  @Post(":bookingId/reschedule")
  reschedule(
    @Param("bookingId") id: string,
    @Body() body: { newStart: string; newEnd: string },
    @Request() req: any,
  ) {
    return this.svc.reschedule(
      id,
      req.user.id,
      new Date(body.newStart),
      new Date(body.newEnd),
    );
  }
}
