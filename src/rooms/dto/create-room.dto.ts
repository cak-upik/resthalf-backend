import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class CreateRoomDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  hotelId: string;

  @ApiProperty({ example: "101", maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ example: "Deluxe" })
  @IsString()
  @IsNotEmpty()
  roomType: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  floor: number;

  @ApiProperty({ example: 250000, description: "12-hour base price" })
  @IsNumber()
  @Min(0)
  basePriceH12: number;

  @ApiProperty({ example: 400000, description: "24-hour base price" })
  @IsNumber()
  @Min(0)
  basePriceH24: number;

  @ApiPropertyOptional({ example: "IDR", default: "IDR" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: "Whether the room is reserved for direct RestHalf bookings",
  })
  @IsOptional()
  @IsBoolean()
  isRingFenced?: boolean;
}
