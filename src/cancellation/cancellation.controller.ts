import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { CancellationService } from "./cancellation.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class CancellationController {
  constructor(private svc: CancellationService) {}

  // Preview refund before committing
  @Get("bookings/:id/cancel-preview")
  previewDirect(@Param("id") id: string) {
    return this.svc.previewDirectCancel(id);
  }

  @Get("wholesale/:id/cancel-preview")
  previewWholesale(@Param("id") id: string) {
    return this.svc.previewWholesaleCancel(id);
  }

  // Confirm cancellation
  @Post("bookings/:id/cancel")
  cancelDirect(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.svc.cancelDirect(id, req.user.id, body.reason);
  }
  
  @Post("wholesale/:id/cancel")
  cancelWholesale(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.svc.cancelWholesale(id, req.user.id, body.reason);
  }
}
