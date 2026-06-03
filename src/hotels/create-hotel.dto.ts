import {
  IsString,
  IsOptional,
  IsPhoneNumber,
  IsNumber,
  IsInt,
  Min,
  Max,
} from "class-validator";

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsPhoneNumber()
  whatsappNumber: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  starRating?: number;
}

export class CreateRoomDto {
  @IsString()
  roomNumber: string;

  @IsString()
  roomType: string;

  @IsInt()
  floor: number;

  @IsNumber()
  @Min(0)
  basePriceH12: number;

  @IsNumber()
  @Min(0)
  basePriceH24: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
