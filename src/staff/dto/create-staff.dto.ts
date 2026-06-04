import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateStaffDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  hotelId: string;

  @ApiProperty({ example: "Budi Santoso", maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: "+628123456789",
    description: "8–15 digits, optional leading +",
  })
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: "phone must be 8–15 digits, optionally prefixed with +",
  })
  phone: string;

  @ApiPropertyOptional({
    enum: ["receptionist", "manager"],
    default: "receptionist",
  })
  @IsOptional()
  @IsIn(["receptionist", "manager"])
  role?: string;

  @ApiProperty({ example: "S3curePass!", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
