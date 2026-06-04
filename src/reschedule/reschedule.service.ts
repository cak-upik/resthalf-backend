import { Booking } from "@/booking/booking.entity";
import { DelegationRecord } from "@/delegation/delegation.entity";
import { DelegationService } from "@/delegation/delegation.service";
import { LedgerService } from "@/ledger/ledger.service";
import { PELService } from "@/pel/pel.service";
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

@Injectable()
export class RescheduleService {
  constructor(
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    @InjectRepository(DelegationRecord)
    private delegations: Repository<DelegationRecord>,
    private pel: PELService,
    private delegation: DelegationService,
    private ledger: LedgerService,
    private ds: DataSource,
  ) {}
  async reschedule(
    bookingId: string,
    guestId: string,
    newStart: Date,
    newEnd: Date,
  ) {
    const booking = await this.bookings.findOneOrFail({
      where: { id: bookingId, guestId, status: "CONFIRMED" },
    });
    // Policy check
    if (booking.policyTierSnapshot === "NON_REFUNDABLE")
      throw new BadRequestException("DATE_CHANGE_NOT_ALLOWED");
    // Cannot reschedule after slot has started
    if (new Date() >= booking.startTime)
      throw new BadRequestException("SLOT_ALREADY_STARTED");
    // New slot must be same type (HALF_DAY or FULL_DAY)
    const oldHrs =
      (booking.endTime.getTime() - booking.startTime.getTime()) / 3600000;
    const newHrs = (newEnd.getTime() - newStart.getTime()) / 3600000;
    if (Math.round(oldHrs) !== Math.round(newHrs))
      throw new BadRequestException("SLOT_TYPE_MISMATCH");
    // PEL validates new slot
    const pel = await this.pel.validateAndLock({
      roomId: booking.roomId,
      requestedStart: newStart,
      requestedEnd: newEnd,
      requestingEntityId: guestId,
      isDesignatedEntity: true,
    });
    if (!pel.allowed) throw new BadRequestException(pel.reason);
    await this.ds.transaction(async (em) => {
      // Expire original delegation
      const oldDel = await this.delegations.findOne({
        where: { bookingId, status: "ACTIVE" },
      });
      if (oldDel)
        await em.update(DelegationRecord, oldDel.id, {
          status: "EXPIRED",
          expiredAt: new Date(),
        });
      // Update booking times
      await em.update(Booking, bookingId, {
        startTime: newStart,
        endTime: newEnd,
      });
    });
    // Create new delegation for new slot
    const newDel = await this.delegation.create({
      roomId: booking.roomId,
      bookingId,
      guestId,
      startTime: newStart,
      endTime: newEnd,
    });
    // Append to ledger + reschedule log
    await this.ledger.append({
      roomId: booking.roomId,
      bookingId,
      delegationId: newDel.id,
      eventType: "AUTHORITY_RESCHEDULED",
      eventData: {
        oldStart: booking.startTime,
        oldEnd: booking.endTime,
        newStart,
        newEnd,
      },
      actor: "guest",
    });
    await this.pel.releaseLock(pel.lockKey!);
    return { success: true, newDelegationId: newDel.id };
  }
}
