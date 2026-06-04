import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdatePricingDto {
  @ApiPropertyOptional({ example: 275000, description: "12-hour base price" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePriceH12?: number;

  @ApiPropertyOptional({ example: 450000, description: "24-hour base price" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePriceH24?: number;

  @ApiPropertyOptional({ example: "IDR" })
  @IsOptional()
  @IsString()
  currency?: string;
}
