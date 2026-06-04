import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class MarkOverstayDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  delegationId: string;

  @ApiPropertyOptional({ example: "Guest refused to leave", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
