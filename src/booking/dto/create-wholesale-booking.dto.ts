import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

const SUPPLIERS = ["TBO", "HOTELBEDS", "RATEHAWK"] as const;

export class CreateWholesaleBookingDto {
  @ApiProperty({ enum: SUPPLIERS, example: "TBO", description: "Supplier code" })
  @IsIn(SUPPLIERS)
  supplier: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  supplierHotelId: string;

  @ApiProperty({ description: "Opaque rate key returned by the supplier search" })
  @IsString()
  @IsNotEmpty()
  supplierRateKey: string;

  @ApiProperty({ example: "Grand Hyatt Jakarta" })
  @IsString()
  @IsNotEmpty()
  hotelName: string;

  @ApiPropertyOptional({ example: "Jakarta" })
  @IsOptional()
  @IsString()
  hotelCity?: string;

  @ApiProperty({ example: "2026-06-10", description: "ISO date" })
  @IsString()
  @IsNotEmpty()
  checkIn: string;

  @ApiProperty({ example: "2026-06-12", description: "ISO date" })
  @IsString()
  @IsNotEmpty()
  checkOut: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  nights: number;

  @ApiProperty({ example: 1500000, description: "Price charged to the guest" })
  @IsNumber()
  @Min(0)
  guestSellingRate: number;

  @ApiProperty({ example: "IDR", default: "IDR" })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
