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
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { Staff } from "./staff.entity";

@Controller("admin/staff")
@UseGuards(StaffAuthGuard)
export class StaffController {
  constructor(@InjectRepository(Staff) private repo: Repository<Staff>) {}

  @Post()
  async create(
    @Body()
    body: {
      hotelId: string;
      name: string;
      phone: string;
      role?: string;
      password: string;
    },
  ) {
    const passwordHash = await bcrypt.hash(body.password, 12);
    const { password, ...rest } = body;
    return this.repo.save(this.repo.create({ ...rest, passwordHash }));
  }

  @Get()
  findAll(@Query("hotelId") hotelId: string) {
    return this.repo.find({ where: { hotelId, isActive: true } });
  }
  
  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.repo.update(id, { isActive: false });
  }
}
