import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WholesaleBooking } from "./wholesale-booking.entity";
import { WholesaleService } from "./wholesale.service";
import { PaymentService } from "../payment/payment.service";
import { Guest } from "../guests/guest.entity";

@Injectable()
export class WholesaleBookingService {
  constructor(
    @InjectRepository(WholesaleBooking)
    private repo: Repository<WholesaleBooking>,
    @InjectRepository(Guest) private guests: Repository<Guest>,
    private wholesale: WholesaleService,
    private payment: PaymentService,
  ) {}

  // Called by BookingController.createWholesale()
  async initiate(params: {
    guestId: string;
    supplier: string;
    supplierHotelId: string;
    supplierRateKey: string;
    hotelName: string;
    hotelCity?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guestSellingRate: number;
    currency: string;
  }) {
    const guest = await this.guests.findOne({ where: { id: params.guestId } });
    if (!guest) throw new BadRequestException("Guest not found");
    // 1. Create pending wholesale booking record
    const pending = await this.repo.save(
      this.repo.create({
        guestId: params.guestId,
        supplier: params.supplier,
        supplierHotelId: params.supplierHotelId,
        supplierRateKey: params.supplierRateKey,
        hotelName: params.hotelName,
        hotelCity: params.hotelCity,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        nights: params.nights,
        guestSellingRate: params.guestSellingRate,
        currency: params.currency ?? "IDR",
        status: "PENDING",
        paymentStatus: "PENDING",
      }),
    );
    // 2. Create Midtrans payment token
    const orderId = `RH-WS-${pending.id.slice(0, 8)}-${Date.now()}`;
    const snap = await this.payment.createSnapToken({
      orderId,
      amount: Math.round(params.guestSellingRate),
      guestName: guest.fullName,
      guestPhone: guest.phone,
      description: `${params.nights}n at ${params.hotelName}`,
    });
    await this.repo.update(pending.id, { midtransOrderId: orderId });
    return {
      bookingId: pending.id,
      orderId,
      snapToken: snap.token,
      redirectUrl: snap.redirectUrl,
      amount: params.guestSellingRate,
      status: pending.status,
    };
  }
  
  // Called by PaymentController after Midtrans webhook
  async confirmPaymentAndBook(orderId: string) {
    const booking = await this.repo.findOne({
      where: { midtransOrderId: orderId },
    });
    if (!booking || booking.paymentStatus === "PAID") return; // idempotent
    await this.repo.update(booking.id, { paymentStatus: "PAID" });
    // Now actually book with the supplier
    const guest = await this.guests.findOne({ where: { id: booking.guestId } });
    const result = await this.wholesale.book({
      ...booking,
      firstName: guest.fullName.split(" ")[0],
      lastName: guest.fullName.split(" ").slice(1).join(" ") || "Guest",
    });
    return result;
  }
}
