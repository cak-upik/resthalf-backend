import { IsString, MinLength, Matches } from "class-validator";

export class GuestRegisterDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;
}
export class LoginDto {
  @Matches(/^\+?[0-9]{8,15}$/)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
