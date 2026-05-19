import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { Hotel } from "./hotel.entity";

@Controller("admin/hotels")
@UseGuards(StaffAuthGuard)
export class HotelsController {
  constructor(@InjectRepository(Hotel) private repo: Repository<Hotel>) {}

  @Post()
  create(
    @Body()
    body: {
      name: string;
      city: string;
      countryCode?: string;
      whatsappNumber: string;
      starRating?: number;
    },
  ) {
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

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Partial<Hotel>) {
    return this.repo
      .update(id, body)
      .then(() => this.repo.findOneOrFail({ where: { id } }));
  }
  
  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.repo.update(id, { isActive: false });
  }
}
