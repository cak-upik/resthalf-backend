import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateHotelDto {
  @ApiProperty({ example: "Grand Hyatt Jakarta", maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: "Jakarta" })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: "Jl. M.H. Thamrin No.28-30" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: "ID", default: "ID", maxLength: 2 })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @ApiProperty({ example: "+628123456789" })
  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  starRating?: number;
}
