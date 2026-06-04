import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class ConfirmVacateDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  delegationId: string;

  @ApiPropertyOptional({ example: "Guest left at 14:05", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
