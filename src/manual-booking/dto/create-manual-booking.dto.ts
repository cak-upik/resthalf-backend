import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateManualBookingDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  roomId: string;

  @ApiProperty({ example: "Walk-in Guest" })
  @IsString()
  @IsNotEmpty()
  guestName: string;

  @ApiPropertyOptional({
    example: "+628123456789",
    description: "8–15 digits, optional leading +",
  })
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: "guestPhone must be 8–15 digits, optionally prefixed with +",
  })
  guestPhone?: string;

  @ApiPropertyOptional({ example: "guest@example.com" })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiProperty({ example: "2026-06-10T08:00:00.000Z", description: "ISO 8601 start time" })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: "2026-06-10T20:00:00.000Z", description: "ISO 8601 end time" })
  @IsDateString()
  endTime: string;

  @ApiProperty({ enum: ["HALF_DAY", "FULL_DAY"], example: "HALF_DAY" })
  @IsIn(["HALF_DAY", "FULL_DAY"])
  slotType: string;

  @ApiProperty({ example: 250000, minimum: 0 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    enum: ["AT_HOTEL", "CASH", "CARD", "QRIS"],
    default: "AT_HOTEL",
  })
  @IsOptional()
  @IsIn(["AT_HOTEL", "CASH", "CARD", "QRIS"])
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 100, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ApiPropertyOptional({ example: "Late checkout requested" })
  @IsOptional()
  @IsString()
  notes?: string;
}
