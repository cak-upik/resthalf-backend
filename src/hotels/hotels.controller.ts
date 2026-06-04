import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { Hotel } from "./hotel.entity";
import { CreateHotelDto } from "./dto/create-hotel.dto";
import { UpdateHotelDto } from "./dto/update-hotel.dto";

@ApiTags("Admin")
@ApiBearerAuth("access-token")
@Controller("admin/hotels")
@UseGuards(StaffAuthGuard)
export class HotelsController {
  constructor(@InjectRepository(Hotel) private repo: Repository<Hotel>) {}

  @ApiOperation({ summary: "Create a hotel" })
  @Post()
  create(@Body() body: CreateHotelDto) {
    return this.repo.save(this.repo.create(body));
  }

  @Get()
  findAll() {
    return this.repo.find({ where: { isActive: true } });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.repo.findOneOrFail({ where: { id } });
  }

  @ApiOperation({ summary: "Update a hotel" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateHotelDto) {
    return this.repo
      .update(id, body)
      .then(() => this.repo.findOneOrFail({ where: { id } }));
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.repo.update(id, { isActive: false });
  }
}
