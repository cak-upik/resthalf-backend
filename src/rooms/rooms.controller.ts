import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { Room } from "./room.entity";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdatePricingDto } from "./dto/update-pricing.dto";

@ApiTags("Admin")
@ApiBearerAuth("access-token")
@Controller("admin/rooms")
@UseGuards(StaffAuthGuard)
export class RoomsController {
  constructor(@InjectRepository(Room) private repo: Repository<Room>) {}

  @ApiOperation({ summary: "Create a room" })
  @Post()
  create(@Body() body: CreateRoomDto) {
    return this.repo.save(
      this.repo.create({ ...body, isRingFenced: body.isRingFenced ?? true }),
    );
  }

  @Get()
  findAll(@Query("hotelId") hotelId: string) {
    return this.repo.find({ where: { hotelId, isActive: true } });
  }

  // Ring-fence: make room available for Direct RestHalf bookings
  @Patch(":id/ring-fence")
  ringFence(@Param("id") id: string) {
    return this.repo.update(id, { isRingFenced: true });
  }

  // Un-ring-fence: return room to channel manager / PMS
  @Patch(":id/un-ring-fence")
  unRingFence(@Param("id") id: string) {
    return this.repo.update(id, { isRingFenced: false });
  }
  
  @ApiOperation({ summary: "Update room pricing" })
  @Patch(":id/pricing")
  updatePricing(@Param("id") id: string, @Body() body: UpdatePricingDto) {
    return this.repo.update(id, body);
  }
}
