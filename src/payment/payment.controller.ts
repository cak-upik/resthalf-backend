import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PaymentService } from "./payment.service";
import { CreateSnapDto } from "./dto/create-snap.dto";
import { BookingService } from "../booking/booking.service";
import { WholesaleBookingService } from "../wholesale/wholesale-booking.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Booking } from "../booking/booking.entity";
import { WholesaleBooking } from "../wholesale/wholesale-booking.entity";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

@ApiTags("Payment")
@Controller("payment")
export class PaymentController {
  constructor(
    private payment: PaymentService,
    private bookingService: BookingService,
    private wholesaleBookingService: WholesaleBookingService,
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    @InjectRepository(WholesaleBooking)
    private wholesale: Repository<WholesaleBooking>,
    @InjectRedis() private redis: Redis,
  ) {}

  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create a Midtrans Snap payment token" })
  @UseGuards(JwtAuthGuard)
  @Post("create-snap")
  createSnap(@Body() body: CreateSnapDto) {
    return this.payment.createSnapToken(body);
  }
  
  // Midtrans calls this — no JWT guard, verified by signature
  @ApiOperation({
    summary: "Midtrans payment webhook (called by Midtrans, signature-verified)",
  })
  @ApiBody({
    description:
      "Raw Midtrans notification payload. Not validated by a DTO because Midtrans sends many provider-specific fields; the signature is verified instead.",
    schema: {
      type: "object",
      properties: {
        order_id: { type: "string", example: "RH-WS-8f1d2a3b-1718000000000" },
        status_code: { type: "string", example: "200" },
        gross_amount: { type: "string", example: "250000.00" },
        signature_key: { type: "string" },
        transaction_status: { type: "string", example: "settlement" },
        transaction_id: { type: "string" },
      },
    },
  })
  @Post("webhook")
  @HttpCode(200)
  async webhook(@Body() body: any) {
    // 1. Verify signature
    const valid = this.payment.verifyWebhook(
      body.order_id,
      body.status_code,
      body.gross_amount,
      body.signature_key ?? "",
    );
    if (!valid) return { status: "ignored", reason: "bad signature" };
    const settled = ["settlement", "capture"].includes(body.transaction_status);
    if (!settled) return { status: "ok", action: "recorded" };
    const orderId: string = body.order_id;
    // 2. Route by order ID prefix
    if (orderId.startsWith("RH-WS-")) {
      // Wholesale — confirm with supplier after payment
      await this.wholesaleBookingService.confirmPaymentAndBook(orderId);
      return { status: "ok", action: "wholesale_confirmed" };
    }
    // Direct — retrieve slot from Redis, create delegation
    await this.bookingService.onPaymentSuccess(orderId, body.transaction_id);
    return { status: "ok", action: "direct_confirmed" };
  }
}
