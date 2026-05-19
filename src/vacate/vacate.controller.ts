import { Controller, Post, Param, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { VacateService } from "./vacate.service";

@Controller("vacate")
@UseGuards(JwtAuthGuard)
export class VacateController {
  constructor(private vacate: VacateService) {}
  
  @Post(":delegationId")
  vacate(@Param("delegationId") id: string, @Request() req: any) {
    return this.vacate.vacate(id, req.user.id);
  }
}
