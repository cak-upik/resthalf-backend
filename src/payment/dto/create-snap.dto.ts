import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateSnapDto {
  @ApiProperty({ example: "RH-8f1d2a3b-1718000000000" })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 250000, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: "Aisha Rahman" })
  @IsString()
  @IsNotEmpty()
  guestName: string;

  @ApiPropertyOptional({ example: "aisha@example.com" })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({ example: "+628123456789" })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiProperty({ example: "12h stay at Grand Hyatt" })
  @IsString()
  @IsNotEmpty()
  description: string;
}
