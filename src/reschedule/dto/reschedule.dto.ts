import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";

export class RescheduleDto {
  @ApiProperty({ example: "2026-06-11T08:00:00.000Z", description: "New ISO 8601 start time" })
  @IsDateString()
  newStart: string;

  @ApiProperty({ example: "2026-06-11T20:00:00.000Z", description: "New ISO 8601 end time" })
  @IsDateString()
  newEnd: string;
}
