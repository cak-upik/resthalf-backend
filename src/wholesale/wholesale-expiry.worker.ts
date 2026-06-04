import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { WholesaleBooking } from "./wholesale-booking.entity";
import { DashboardGateway } from "../dashboard/dashboard.gateway";

@Injectable()
export class WholesaleExpiryWorker {
  private processed = new Set<string>();
  constructor(
    @InjectRepository(WholesaleBooking)
    private repo: Repository<WholesaleBooking>,
    private gateway: DashboardGateway,
  ) {}
  
  @Cron("* * * * *")
  async observeAndRecord() {
    const now = new Date();
    const checkOutToday = await this.repo.find({
      where: {
        status: "CONFIRMED",
        checkOut: LessThan(now.toISOString().split("T")[0]),
      },
    });
    for (const b of checkOutToday) {
      if (this.processed.has(b.id)) continue;
      // STEP 1: RECORD
      await this.repo.update(b.id, { status: "COMPLETED" });
      // STEP 2: RELEASE — our record no longer occupies inventory
      // STEP 3: NOTIFY
      this.gateway.emitWholesaleCheckout({
        bookingId: b.id,
        hotelName: b.hotelName,
        checkOut: b.checkOut,
        supplierRef: b.supplierBookingRef,
      });
      this.processed.add(b.id);
      // NOTHING ELSE. Hotel handles physical checkout.
    }
  }
}
