import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ManualBooking } from "./manual-booking.entity";
import { StaffCommissionAccount } from "./staff-commission.entity";
import { Room } from "../rooms/room.entity";
import { DelegationService } from "../delegation/delegation.service";
import { LedgerService } from "../ledger/ledger.service";
import { PELService } from "../pel/pel.service";

@Injectable()
export class ManualBookingService {
  constructor(
    @InjectRepository(ManualBooking) private repo: Repository<ManualBooking>,
    @InjectRepository(StaffCommissionAccount)
    private commission: Repository<StaffCommissionAccount>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    private delegation: DelegationService,
    private ledger: LedgerService,
    private pel: PELService,
    private ds: DataSource,
  ) {}

  async create(params: {
    hotelId: string;
    roomId: string;
    staffId: string;
    guestName: string;
    guestPhone?: string;
    guestEmail?: string;
    startTime: Date;
    endTime: Date;
    slotType: string;
    totalAmount: number;
    paymentMethod: "AT_HOTEL" | "CASH" | "CARD" | "QRIS";
    commissionPercent?: number;
    notes?: string;
  }): Promise<ManualBooking> {
    const room = await this.rooms.findOne({
      where: { id: params.roomId, isActive: true },
    });
    if (!room) throw new BadRequestException("Room not found or inactive");
    // PEL — same check as online bookings. Manual bookings compete for the same slots.
    const pel = await this.pel.validateAndLock({
      roomId: params.roomId,
      requestedStart: params.startTime,
      requestedEnd: params.endTime,
      requestingEntityId: params.staffId,
      isDesignatedEntity: true,
    });
    if (!pel.allowed)
      throw new BadRequestException(`Room unavailable: ${pel.reason}`);
    const ref = await this.generateRef(params.hotelId);
    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // 1. Create manual booking
      const manual = await qr.manager.save(ManualBooking, {
        bookingReference: ref,
        hotelId: params.hotelId,
        roomId: params.roomId,
        guestName: params.guestName,
        guestPhone: params.guestPhone,
        guestEmail: params.guestEmail,
        createdByStaffId: params.staffId,
        startTime: params.startTime,
        endTime: params.endTime,
        slotType: params.slotType,
        totalAmount: params.totalAmount,
        paymentMethod: params.paymentMethod,
        commissionPercent: params.commissionPercent ?? 10,
        notes: params.notes,
        // If CASH/CARD/QRIS: already paid at desk
        paymentStatus: ["CASH", "CARD", "QRIS"].includes(params.paymentMethod)
          ? "PAID"
          : "PENDING",
        paymentCollectedByStaffId:
          params.paymentMethod !== "AT_HOTEL" ? params.staffId : undefined,
        paymentCollectedAt:
          params.paymentMethod !== "AT_HOTEL" ? new Date() : undefined,
      });
      // 2. Issue delegation authority — manual booking goes through PEL like any direct booking
      const del = await this.delegation.create({
        roomId: params.roomId,
        bookingId: manual.id,
        guestId: manual.id, // manual booking ref as authority holder
        startTime: params.startTime,
        endTime: params.endTime,
      });
      await qr.manager.update(ManualBooking, manual.id, {
        delegationId: del.id,
      });
      // 3. Append to ledger
      await this.ledger.append({
        roomId: params.roomId,
        bookingId: manual.id,
        delegationId: del.id,
        eventType: "AUTHORITY_ISSUED",
        eventData: {
          source: "MANUAL_BOOKING",
          staffId: params.staffId,
          guestName: params.guestName,
          paymentMethod: params.paymentMethod,
          reference: ref,
        },
        actor: "staff",
      });
      // 4. Upsert commission account
      let account = await this.commission.findOne({
        where: { staffId: params.staffId, hotelId: params.hotelId },
      });
      const commAmt = +(
        (params.totalAmount * (params.commissionPercent ?? 10)) /
        100
      ).toFixed(2);
      if (!account) {
        account = this.commission.create({
          staffId: params.staffId,
          hotelId: params.hotelId,
          totalCommissionEarned: commAmt,
          currentBalance: commAmt,
        });
      } else {
        account.totalCommissionEarned += commAmt;
        account.currentBalance += commAmt;
      }
      await qr.manager.save(account);
      await qr.commitTransaction();
      return qr.manager.findOne(ManualBooking, { where: { id: manual.id } });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
      if (pel.lockKey) await this.pel.releaseLock(pel.lockKey);
    }
  }

  async recordPayment(
    bookingId: string,
    staffId: string,
  ): Promise<ManualBooking> {
    const b = await this.repo.findOne({ where: { id: bookingId } });
    if (!b) throw new BadRequestException("Booking not found");
    if (b.paymentStatus === "PAID")
      throw new BadRequestException("Already paid");
    await this.repo.update(bookingId, {
      paymentStatus: "PAID",
      paymentCollectedByStaffId: staffId,
      paymentCollectedAt: new Date(),
    });
    await this.ledger.append({
      roomId: b.roomId,
      bookingId: b.id,
      delegationId: b.delegationId,
      eventType: "PAYMENT_CAPTURED",
      eventData: {
        amount: b.totalAmount,
        method: b.paymentMethod,
        collectedBy: staffId,
      },
      actor: "staff",
    });
    return this.repo.findOne({ where: { id: bookingId } });
  }

  async approveCommission(bookingId: string): Promise<void> {
    await this.repo.update(bookingId, { commissionStatus: "APPROVED" });
  }

  async listForHotel(hotelId: string, limit = 50) {
    return this.repo.find({
      where: { hotelId },
      relations: ["room", "hotel", "createdByStaff"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
  
  private async generateRef(hotelId: string): Promise<string> {
    const d = new Date();
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
    const short = hotelId.slice(0, 4).toUpperCase();
    const count = (await this.repo.count({ where: { hotelId } })) + 1;
    return `RH-MAN-${short}-${ymd}-${String(count).padStart(3, "0")}`;
  }
}
