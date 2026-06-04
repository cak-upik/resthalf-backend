import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "+628123456789",
    description: "Registered phone number (8–15 digits, optional leading +)",
  })
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: "phone must be 8–15 digits, optionally prefixed with +",
  })
  phone: string;

  @ApiProperty({ example: "S3curePass!" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
