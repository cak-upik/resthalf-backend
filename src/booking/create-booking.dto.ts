import {
  IsUUID,
  IsDateString,
  IsIn,
  IsNumber,
  IsString,
} from "class-validator";

export class CreateDirectBookingDto {
  @IsUUID()
  roomId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsIn(["HALF_DAY", "FULL_DAY"])
  slotType: string;
}

export class CreateWholesaleBookingDto {
  @IsIn(["TBO", "HOTELBEDS", "RATEHAWK"])
  supplier: string;

  @IsUUID()
  supplierHotelId: string;

  @IsString()
  supplierRateKey: string;

  @IsString()
  hotelName: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsNumber()
  nights: number;

  @IsNumber()
  guestSellingRate: number;
}
