import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class SearchDto {
  @ApiProperty({ example: "Jakarta" })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: "2026-06-10", description: "ISO date" })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nights: number = 1;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number = 1;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: "Set false to exclude wholesale supplier results",
  })
  @IsOptional()
  // Query strings arrive as text; treat only the literal "false" as false.
  @Transform(({ value }) => value !== "false" && value !== false)
  @IsBoolean()
  includeWholesale: boolean = true;
}
