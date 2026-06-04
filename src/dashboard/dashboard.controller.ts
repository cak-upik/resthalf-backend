import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { DashboardService } from "./dashboard.service";
import { ConfirmVacateDto } from "./dto/confirm-vacate.dto";
import { MarkOverstayDto } from "./dto/mark-overstay.dto";

@ApiTags("Dashboard")
@ApiBearerAuth("access-token")
@Controller("dashboard")
@UseGuards(StaffAuthGuard)
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get("rooms")
  getLiveRoomStatus(@Request() req: any) {
    return this.svc.getLiveRoomStatus(req.staff.hotelId);
  }

  @Get("checkins")
  getTodayCheckins(@Request() req: any) {
    return this.svc.getTodayCheckins(req.staff.hotelId);
  }

  @Get("revenue")
  getRevenueSummary(@Request() req: any) {
    return this.svc.getRevenueSummary(req.staff.hotelId, 30);
  }

  @Get("rooms/:roomId/timeline")
  getRoomTimeline(@Param("roomId") roomId: string) {
    return this.svc.getRoomTimeline(roomId);
  }

  // v2.0: Staff confirms guest physically left
  @ApiOperation({ summary: "Confirm a guest has physically vacated a room" })
  @Post("rooms/:roomId/confirm-vacated")
  confirmVacated(
    @Param("roomId") roomId: string,
    @Body() body: ConfirmVacateDto,
    @Request() req: any,
  ) {
    return this.svc.confirmPhysicalVacate(
      roomId,
      body.delegationId,
      req.staff.id,
      body.notes,
    );
  }
  
  // v2.0: Staff records overstay — physical management is theirs
  @ApiOperation({ summary: "Record a guest overstay" })
  @Post("rooms/:roomId/mark-overstay")
  markOverstay(
    @Param("roomId") roomId: string,
    @Body() body: MarkOverstayDto,
    @Request() req: any,
  ) {
    return this.svc.markOverstay(
      roomId,
      body.delegationId,
      req.staff.id,
      body.reason,
    );
  }
}
