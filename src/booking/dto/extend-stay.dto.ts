import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class ExtendStayDto {
  @ApiProperty({ enum: [12, 24], example: 12, description: "Extra hours to extend" })
  @IsIn([12, 24])
  extraHours: 12 | 24;
}
