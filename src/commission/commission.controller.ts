import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { StaffCommissionAccount } from "../manual-booking/staff-commission.entity";
import { CommissionPayoutRequest } from "../manual-booking/payout-request.entity";
import { ManualBooking } from "../manual-booking/manual-booking.entity";

@Controller("commission")
@UseGuards(StaffAuthGuard)
export class CommissionController {
  constructor(
    @InjectRepository(StaffCommissionAccount)
    private accounts: Repository<StaffCommissionAccount>,
    @InjectRepository(CommissionPayoutRequest)
    private payouts: Repository<CommissionPayoutRequest>,
    @InjectRepository(ManualBooking)
    private bookings: Repository<ManualBooking>,
  ) {}

  // Staff: my commission balance
  @Get("my-balance")
  async myBalance(@Request() req: any) {
    const a = await this.accounts.findOne({
      where: { staffId: req.staff.id, hotelId: req.staff.hotelId },
    });
    return {
      balance: a?.currentBalance ?? 0,
      totalEarned: a?.totalCommissionEarned ?? 0,
      totalPaid: a?.totalCommissionPaid ?? 0,
    };
  }

  // Staff: bookings that earned me commission
  @Get("my-earnings")
  async myEarnings(@Request() req: any) {
    const list = await this.bookings.find({
      where: { createdByStaffId: req.staff.id },
      relations: ["room"],
      order: { createdAt: "DESC" },
      take: 100,
    });
    return list.map((b) => ({
      reference: b.bookingReference,
      guestName: b.guestName,
      room: b.room?.roomNumber,
      checkIn: b.startTime,
      checkOut: b.endTime,
      amount: b.totalAmount,
      commissionPercent: b.commissionPercent,
      commissionAmount: b.commissionAmount,
      commissionStatus: b.commissionStatus,
      paymentStatus: b.paymentStatus,
      date: b.createdAt,
    }));
  }

  // Staff: request payout
  @Post("request-payout")
  async requestPayout(
    @Body()
    body: {
      amount: number;
      payoutMethod: string;
      accountDetails: any;
    },
    @Request() req: any,
  ) {
    const a = await this.accounts.findOne({
      where: { staffId: req.staff.id, hotelId: req.staff.hotelId },
    });
    if (!a || a.currentBalance < body.amount)
      throw new BadRequestException("Insufficient commission balance");
    const req2 = await this.payouts.save({
      staffId: req.staff.id,
      hotelId: req.staff.hotelId,
      requestedAmount: body.amount,
      payoutMethod: body.payoutMethod,
      accountDetails: body.accountDetails,
    });
    return { requestId: req2.id, status: "PENDING" };
  }

  // Manager: all staff balances for this hotel
  @Get("staff-balances")
  async staffBalances(@Request() req: any) {
    if (req.staff.role !== "manager")
      throw new BadRequestException("Managers only");
    return this.accounts.find({
      where: { hotelId: req.staff.hotelId },
      relations: ["staff"],
      order: { currentBalance: "DESC" },
    });
  }

  // Manager: approve payout request
  @Post("payouts/:id/approve")
  async approvePayout(@Param("id") id: string, @Request() req: any) {
    if (req.staff.role !== "manager")
      throw new BadRequestException("Managers only");
    const p = await this.payouts.findOne({ where: { id } });
    if (!p) throw new BadRequestException("Request not found");
    const a = await this.accounts.findOne({
      where: { staffId: p.staffId, hotelId: p.hotelId },
    });
    if (a) {
      a.currentBalance -= p.requestedAmount;
      a.totalCommissionPaid += p.requestedAmount;
      a.lastPayoutDate = new Date();
      await this.accounts.save(a);
    }
    await this.payouts.update(id, {
      status: "APPROVED",
      approvedByStaffId: req.staff.id,
      approvedAt: new Date(),
    });
    return { success: true };
  }
  
  // Manager: reject payout request
  @Post("payouts/:id/reject")
  async rejectPayout(
    @Param("id") id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    if (req.staff.role !== "manager")
      throw new BadRequestException("Managers only");
    await this.payouts.update(id, {
      status: "REJECTED",
      rejectionReason: body.reason,
    });
    return { success: true };
  }
}
