import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterGuestDto {
  @ApiProperty({ example: "Aisha Rahman", maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({
    example: "+628123456789",
    description: "8–15 digits, optional leading +",
  })
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: "phone must be 8–15 digits, optionally prefixed with +",
  })
  phone: string;

  @ApiPropertyOptional({ example: "aisha@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "S3curePass!", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
