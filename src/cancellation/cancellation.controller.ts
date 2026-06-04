import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/jwt.guard";
import { CancellationService } from "./cancellation.service";
import { CancelDto } from "./dto/cancel.dto";

@ApiTags("Cancellation")
@ApiBearerAuth("access-token")
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
  @ApiOperation({ summary: "Cancel a direct booking" })
  @Post("bookings/:id/cancel")
  cancelDirect(
    @Param("id") id: string,
    @Body() body: CancelDto,
    @Request() req: any,
  ) {
    return this.svc.cancelDirect(id, req.user.id, body.reason);
  }

  @ApiOperation({ summary: "Cancel a wholesale booking" })
  @Post("wholesale/:id/cancel")
  cancelWholesale(
    @Param("id") id: string,
    @Body() body: CancelDto,
    @Request() req: any,
  ) {
    return this.svc.cancelWholesale(id, req.user.id, body.reason);
  }
}
