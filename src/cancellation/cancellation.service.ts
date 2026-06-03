import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Booking } from "../booking/booking.entity";
import { WholesaleBooking } from "../wholesale/wholesale-booking.entity";
import { DelegationRecord } from "../delegation/delegation.entity";
import { LedgerService } from "../ledger/ledger.service";
import { PaymentService } from "../payment/payment.service";
import { WholesaleService } from "../wholesale/wholesale.service";
import {
  RefundCalculation,
  DIRECT_CANCELLATION_RULES,
} from "./cancellation.types";
import { parseSupplierPolicy } from "./policy-parser";

@Injectable()
export class CancellationService {
  private readonly logger = new Logger(CancellationService.name);
  constructor(
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    @InjectRepository(WholesaleBooking)
    private wholesale: Repository<WholesaleBooking>,
    @InjectRepository(DelegationRecord)
    private delegations: Repository<DelegationRecord>,
    private ledger: LedgerService,
    private payment: PaymentService,
    private wsService: WholesaleService,
    private ds: DataSource,
  ) {}

  // DIRECT BOOKING CANCELLATION
  async cancelDirect(bookingId: string, guestId: string, reason?: string) {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new BadRequestException("Booking not found");
    if (booking.guestId !== guestId)
      throw new BadRequestException("Not authorised");
    if (booking.status === "CANCELLED")
      throw new BadRequestException("Already cancelled");
    // Get the delegation to know the start time
    const delegation = await this.delegations.findOne({
      where: { bookingId: booking.id },
    });
    if (!delegation) throw new BadRequestException("No delegation found");
    // Calculate refund based on Direct rules
    const calc = this.calcDirectRefund(
      +booking.totalPrice,
      delegation.startTime,
    );
    if (!calc.allowed) throw new BadRequestException(calc.reason);
    // Execute in transaction
    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // Mark booking cancelled
      await qr.manager.update(Booking, bookingId, { status: "CANCELLED" });
      // Release delegation
      if (delegation.status === "ACTIVE") {
        await qr.manager.update(DelegationRecord, delegation.id, {
          status: "VACATED",
          vacatedAt: new Date(),
        });
      }
      // Process Midtrans refund if amount > 0
      let midtransRefundId: string | undefined;
      if (calc.refundAmount > 0 && booking.midtransOrderId) {
        try {
          const refund = await this.payment.refund(
            booking.midtransOrderId,
            calc.refundAmount,
            reason ?? "Guest cancellation",
          );
          midtransRefundId = refund?.refundKey;
        } catch (e) {
          this.logger.error("Midtrans refund failed:", e);
          // Non-fatal — log it, continue. Manual refund may be needed.
        }
      }
      // Append to immutable ledger
      await this.ledger.append({
        roomId: booking.roomId,
        bookingId,
        delegationId: delegation.id,
        eventType:
          calc.refundAmount > 0 ? "PAYMENT_REFUNDED" : "AUTHORITY_EXPIRED",
        eventData: {
          source: "CANCELLATION",
          policyType: calc.policyType,
          originalAmount: calc.originalAmount,
          refundAmount: calc.refundAmount,
          refundPercent: calc.refundPercent,
          reason,
          midtransRefundId,
        },
        actor: "guest",
      });
      await qr.commitTransaction();
      return { success: true, ...calc, midtransRefundId };
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  // WHOLESALE BOOKING CANCELLATION
  async cancelWholesale(bookingId: string, guestId: string, reason?: string) {
    const booking = await this.wholesale.findOne({ where: { id: bookingId } });
    if (!booking) throw new BadRequestException("Booking not found");
    if (booking.guestId !== guestId)
      throw new BadRequestException("Not authorised");
    if (booking.status === "CANCELLED")
      throw new BadRequestException("Already cancelled");
    // Parse stored supplier policy
    const policy = parseSupplierPolicy(
      booking.cancellationPolicy,
      booking.cancellationDeadline
        ? new Date(booking.cancellationDeadline)
        : null,
      booking.isRefundable,
    );
    const calc = this.calcWholesaleRefund(+booking.guestSellingRate, policy);
    if (!calc.allowed) throw new BadRequestException(calc.reason);
    // Call supplier cancel API
    if (booking.supplierBookingRef) {
      try {
        await this.wsService.cancelWithSupplier(
          booking.supplier,
          booking.supplierBookingRef,
        );
      } catch (e) {
        this.logger.error(
          `Supplier cancel failed for ${booking.supplierBookingRef}:`,
          e,
        );
        // Non-fatal — record and continue. Manual supplier cancel may be needed.
      }
    }
    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.manager.update(WholesaleBooking, bookingId, {
        status: "CANCELLED",
        cancelledAt: new Date(),
      });
      let midtransRefundId: string | undefined;
      if (calc.refundAmount > 0 && booking.midtransOrderId) {
        try {
          const refund = await this.payment.refund(
            booking.midtransOrderId,
            calc.refundAmount,
            reason ?? `Wholesale cancellation — ${calc.policyType}`,
          );
          midtransRefundId = refund?.refundKey;
        } catch (e) {
          this.logger.error("Midtrans wholesale refund failed:", e);
        }
      }
      await this.ledger.append({
        bookingId,
        eventType:
          calc.refundAmount > 0 ? "PAYMENT_REFUNDED" : "AUTHORITY_EXPIRED",
        eventData: {
          source: "WHOLESALE_CANCELLATION",
          supplier: booking.supplier,
          supplierRef: booking.supplierBookingRef,
          policyType: calc.policyType,
          originalAmount: calc.originalAmount,
          refundAmount: calc.refundAmount,
          refundPercent: calc.refundPercent,
          rawPolicy: booking.cancellationPolicy,
          reason,
          midtransRefundId,
        },
        actor: "guest",
      });
      await qr.commitTransaction();
      return { success: true, ...calc, midtransRefundId };
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  // REFUND CALCULATORS
  private calcDirectRefund(amount: number, startTime: Date): RefundCalculation {
    const hoursUntilStart = (startTime.getTime() - Date.now()) / 3600000;
    if (hoursUntilStart <= 0) {
      return {
        allowed: false,
        policyType: "NON_REFUNDABLE",
        originalAmount: amount,
        refundAmount: 0,
        refundPercent: 0,
        deadlinePassed: true,
        reason: "Cannot cancel after stay has started",
      };
    }
    if (hoursUntilStart > DIRECT_CANCELLATION_RULES.FREE_WINDOW_HOURS) {
      return {
        allowed: true,
        policyType: "FREE_CANCELLATION",
        originalAmount: amount,
        refundAmount: amount,
        refundPercent: 100,
        deadlinePassed: false,
        reason: "Full refund — cancelled more than 2 hours before start",
      };
    }
    const partial = +(
      (amount * DIRECT_CANCELLATION_RULES.PARTIAL_PERCENT) /
      100
    ).toFixed(2);
    return {
      allowed: true,
      policyType: "PARTIAL",
      originalAmount: amount,
      refundAmount: partial,
      refundPercent: DIRECT_CANCELLATION_RULES.PARTIAL_PERCENT,
      deadlinePassed: false,
      reason: "50% refund — cancelled within 2-hour window",
    };
  }

  private calcWholesaleRefund(amount: number, policy: any): RefundCalculation {
    if (policy.type === "NON_REFUNDABLE") {
      return {
        allowed: true,
        policyType: "NON_REFUNDABLE",
        originalAmount: amount,
        refundAmount: 0,
        refundPercent: 0,
        deadlinePassed: false,
        reason: "Non-refundable booking — no amount returned",
      };
    }
    const now = Date.now();
    const deadlinePassed = policy.deadline
      ? policy.deadline.getTime() < now
      : false;
    if (deadlinePassed) {
      return {
        allowed: true,
        policyType: "NON_REFUNDABLE",
        originalAmount: amount,
        refundAmount: 0,
        refundPercent: 0,
        deadlinePassed: true,
        reason: `Cancellation deadline passed (${policy.deadline?.toISOString()})`,
      };
    }
    const refund = +((amount * policy.refundPercent) / 100).toFixed(2);
    return {
      allowed: true,
      policyType: policy.type,
      originalAmount: amount,
      refundAmount: refund,
      refundPercent: policy.refundPercent,
      deadlinePassed: false,
      reason: `${policy.refundPercent}% refund per supplier policy`,
    };
  }

  // Preview what refund guest would receive — no changes made
  async previewDirectCancel(bookingId: string) {
    const b = await this.bookings.findOne({ where: { id: bookingId } });
    if (!b) throw new BadRequestException("Booking not found");
    const d = await this.delegations.findOne({ where: { bookingId } });
    if (!d) throw new BadRequestException("No delegation");
    return this.calcDirectRefund(+b.totalPrice, d.startTime);
  }
  
  async previewWholesaleCancel(bookingId: string) {
    const b = await this.wholesale.findOne({ where: { id: bookingId } });
    if (!b) throw new BadRequestException("Booking not found");
    const policy = parseSupplierPolicy(
      b.cancellationPolicy,
      b.cancellationDeadline ? new Date(b.cancellationDeadline) : null,
      b.isRefundable,
    );
    return this.calcWholesaleRefund(+b.guestSellingRate, policy);
  }
}
