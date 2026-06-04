import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsObject, IsString, Min } from "class-validator";

export class RequestPayoutDto {
  @ApiProperty({ example: 250000, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: "BANK_TRANSFER" })
  @IsString()
  @IsNotEmpty()
  payoutMethod: string;

  @ApiProperty({
    type: Object,
    example: { bank: "BCA", accountNumber: "1234567890", accountName: "Budi" },
    description: "Payout destination details (free-form object)",
  })
  @IsObject()
  accountDetails: Record<string, any>;
}
