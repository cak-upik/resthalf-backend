import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsIn, IsUUID } from "class-validator";

export class CreateDirectBookingDto {
  @ApiProperty({ format: "uuid", example: "8f1d2a3b-0000-0000-0000-000000000000" })
  @IsUUID()
  roomId: string;

  @ApiProperty({ example: "2026-06-10T08:00:00.000Z", description: "ISO 8601 start time" })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: "2026-06-10T20:00:00.000Z", description: "ISO 8601 end time" })
  @IsDateString()
  endTime: string;

  @ApiProperty({ enum: ["HALF_DAY", "FULL_DAY"], example: "HALF_DAY" })
  @IsIn(["HALF_DAY", "FULL_DAY"])
  slotType: string;
}
