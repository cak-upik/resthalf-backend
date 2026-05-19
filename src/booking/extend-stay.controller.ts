import {
  Controller,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ExtendStayService } from "./extend-stay.service";

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class ExtendStayController {
  constructor(private extend: ExtendStayService) {}
  
  @Post(":delegationId/extend")
  extend(
    @Param("delegationId") id: string,
    @Body() body: { extraHours: 12 | 24 },
    @Request() req: any,
  ) {
    return this.extend.initiateExtend(id, req.user.id, body.extraHours);
  }
}
