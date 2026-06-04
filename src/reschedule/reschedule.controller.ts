import { JwtAuthGuard } from "@/auth/jwt.guard";
import {
  Controller,
  UseGuards,
  Post,
  Param,
  Body,
  Request,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RescheduleService } from "./reschedule.service";
import { RescheduleDto } from "./dto/reschedule.dto";

@ApiTags("Reschedule")
@ApiBearerAuth("access-token")
@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class RescheduleController {
  constructor(private svc: RescheduleService) {}

  // POST /bookings/:bookingId/reschedule
  @ApiOperation({ summary: "Reschedule a booking to a new time window" })
  @Post(":bookingId/reschedule")
  reschedule(
    @Param("bookingId") id: string,
    @Body() body: RescheduleDto,
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
