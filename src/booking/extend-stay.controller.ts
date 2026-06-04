import {
  Controller,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/jwt.guard";
import { ExtendStayService } from "./extend-stay.service";
import { ExtendStayDto } from "./dto/extend-stay.dto";

@ApiTags("Bookings")
@ApiBearerAuth("access-token")
@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class ExtendStayController {
  constructor(private extendSvc: ExtendStayService) {}

  @ApiOperation({ summary: "Extend an active stay by 12 or 24 hours" })
  @Post(":delegationId/extend")
  extend(
    @Param("delegationId") id: string,
    @Body() body: ExtendStayDto,
    @Request() req: any,
  ) {
    return this.extendSvc.initiateExtend(id, req.user.id, body.extraHours);
  }
}
