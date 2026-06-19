import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { Booking } from "./booking.entity";
import { PELService } from "../pel/pel.service";
import { DelegationService } from "../delegation/delegation.service";
import { LedgerService } from "../ledger/ledger.service";
import { PaymentService } from "../payment/payment.service";
import { Room } from "../rooms/room.entity";
import { Guest } from "../guests/guest.entity";
import { classifySlot } from "../common/slots";

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Guest) private guests: Repository<Guest>,
    private pel: PELService,
    private delegation: DelegationService,
    private ledger: LedgerService,
    private payment: PaymentService,
    @InjectRedis() private redis: Redis,
  ) {}

  async createBooking(params: {
    roomId: string;
    guestId: string;
    startTime: Date;
    endTime: Date;
  }) {
    // The booked window is the source of truth (stored verbatim, recorded in
    // the ledger, drives the client countdown). We only classify it into a
    // slot for labelling / pricing.
    const { startTime, endTime } = params;
    const slotType = classifySlot(startTime, endTime);
    // 1. PEL validates and acquires Redis lock
    const pel = await this.pel.validateAndLock({
      roomId: params.roomId,
      requestedStart: startTime,
      requestedEnd: endTime,
      requestingEntityId: params.guestId,
      isDesignatedEntity: true,
    });
    if (!pel.allowed)
      throw new BadRequestException({
        code: "TEMPORAL_CONFLICT",
        reason: pel.reason,
      });
    const room = await this.rooms.findOneOrFail({
      where: { id: params.roomId },
    });
    const guest = await this.guests.findOneOrFail({
      where: { id: params.guestId },
    });
    const hrs = (endTime.getTime() - startTime.getTime()) / 3600000;
    const price = hrs <= 12 ? +room.basePriceH12 : +room.basePriceH24;
    // 2. Create PENDING booking — no delegation yet
    const orderId = `RH-${params.roomId.slice(0, 8)}-${Date.now()}`;
    const booking = await this.repo.save(
      this.repo.create({
        roomId: params.roomId,
        guestId: params.guestId,
        slotType,
        startTime,
        endTime,
        totalPrice: price,
        currency: room.currency ?? "IDR",
        status: "PENDING",
        midtransOrderId: orderId,
      }),
    );
    // 3. Store slot in Redis — retrieved by webhook handler
    await this.redis.set(
      `slot:${orderId}`,
      JSON.stringify({
        startTime,
        endTime,
        roomId: params.roomId,
      }),
      "EX",
      900, // 15 min — Midtrans payment window
    );
    // 4. Create Midtrans payment token
    // const snap = await this.payment.createSnapToken({
    //   orderId,
    //   amount: price,
    //   guestName: guest.fullName,
    //   guestPhone: guest.phone,
    //   description: `Room ${room.roomNumber} | ${Math.round(hrs)}h stay`,
    // });
    await this.pel.releaseLock(pel.lockKey!);
    return {
      bookingId: booking.id,
      orderId,
      // snapToken: snap.token,
      // redirectUrl: snap.redirectUrl,
      amount: price,
    };
  }

  // Called by PaymentController AFTER webhook fires
  async onPaymentSuccess(orderId: string, transactionId: string) {
    const booking = await this.repo.findOne({
      where: { midtransOrderId: orderId },
    });
    if (!booking || booking.status === "CONFIRMED") return; // idempotent
    // Retrieve slot from Redis
    const slotJson = await this.redis.get(`slot:${orderId}`);
    if (!slotJson) throw new Error(`Slot data expired for order ${orderId}`);
    const slot = JSON.parse(slotJson);
    await this.redis.del(`slot:${orderId}`);
    // Now create delegation — authority begins
    const delegation = await this.delegation.create({
      roomId: booking.roomId,
      bookingId: booking.id,
      guestId: booking.guestId,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
    });
    await this.repo.update(booking.id, { status: "CONFIRMED" });
    await this.ledger.append({
      roomId: booking.roomId,
      bookingId: booking.id,
      delegationId: delegation.id,
      eventType: "AUTHORITY_ISSUED",
      eventData: { start: slot.startTime, end: slot.endTime, transactionId },
      actor: "system",
    });
    return { success: true, delegationId: delegation.id };
  }
}
