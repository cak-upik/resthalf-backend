import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { CreateHotelDto } from "./create-hotel.dto";

/**
 * All CreateHotelDto fields become optional, plus a few admin-editable extras.
 */
export class UpdateHotelDto extends PartialType(CreateHotelDto) {
  @ApiPropertyOptional({ example: "manual", description: "PMS integration type" })
  @IsOptional()
  @IsString()
  pmsType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
