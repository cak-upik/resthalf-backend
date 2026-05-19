import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PaymentService } from "./payment.service";
import { BookingService } from "../booking/booking.service";
import { WholesaleBookingService } from "../wholesale/wholesale-booking.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Booking } from "../booking/booking.entity";
import { WholesaleBooking } from "../wholesale/wholesale-booking.entity";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

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

  @UseGuards(JwtAuthGuard)
  @Post("create-snap")
  createSnap(
    @Body()
    body: {
      orderId: string;
      amount: number;
      guestName: string;
      guestEmail?: string;
      guestPhone?: string;
      description: string;
    },
  ) {
    return this.payment.createSnapToken(body);
  }
  
  // Midtrans calls this — no JWT guard, verified by signature
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
