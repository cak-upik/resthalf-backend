import { Controller, Post, Param, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { VacateService } from "./vacate.service";

@ApiTags("Vacate")
@ApiBearerAuth("access-token")
@Controller("vacate")
@UseGuards(JwtAuthGuard)
export class VacateController {
  constructor(private vacateSvc: VacateService) {}

  @ApiOperation({ summary: "Guest vacates a room early" })
  @Post(":delegationId")
  vacate(@Param("delegationId") id: string, @Request() req: any) {
    return this.vacateSvc.vacate(id, req.user.id);
  }
}
