import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  WholesaleProvider,
  WholesaleHotelResult,
  WholesaleSearchParams,
} from "./wholesale.interface";
import { TBOProvider } from "./providers/tbo.provider";
import { HotelbedsProvider } from "./providers/hotelbeds.provider";
import { WholesaleBooking } from "./wholesale-booking.entity";

@Injectable()
export class WholesaleService {
  private readonly providers: WholesaleProvider[];
  constructor(
    private tbo: TBOProvider,
    private hotelbeds: HotelbedsProvider,
    @InjectRepository(WholesaleBooking)
    private repo: Repository<WholesaleBooking>,
  ) {
    this.providers = [this.tbo, this.hotelbeds]; // add more providers here
  }

  async search(params: WholesaleSearchParams): Promise<WholesaleHotelResult[]> {
    // Run ALL providers simultaneously
    const settled = await Promise.allSettled(
      this.providers.map((p) => p.search(params)),
    );
    const all: WholesaleHotelResult[] = [];
    for (const r of settled) if (r.status === "fulfilled") all.push(...r.value);
    return this.dedupe(all).sort((a, b) => a.sellingRate - b.sellingRate);
  }

  // Same hotel from two providers: show cheapest rate
  private dedupe(results: WholesaleHotelResult[]) {
    const map = new Map<string, WholesaleHotelResult>();
    for (const r of results) {
      const key = r.hotelName.toLowerCase().replace(/\s+/g, "");
      const ex = map.get(key);
      if (!ex || r.sellingRate < ex.sellingRate) map.set(key, r);
    }
    return Array.from(map.values());
  }

  async book(params: any): Promise<WholesaleBooking> {
    const pending = await this.repo.save({ ...params, status: "PENDING" });
    const provider = this.providers.find((p) => p.name === params.supplier);
    if (!provider) throw new Error(`Unknown supplier: ${params.supplier}`);
    const result = await provider.book(params.supplierRateKey, params);
    if (result.success) {
      await this.repo.update(pending.id, {
        supplierBookingRef: result.supplierRef,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        confirmedAt: new Date(),
      });
    } else {
      await this.repo.update(pending.id, { status: "FAILED" });
      throw new Error(`Booking failed: ${result.failureReason}`);
    }
    return this.repo.findOne({ where: { id: pending.id } });
  }

  async cancelWithSupplier(
    supplier: string,
    supplierRef: string,
  ): Promise<void> {
    const provider = this.providers.find((p) => p.name === supplier);
    if (!provider) throw new Error(`Unknown supplier: ${supplier}`);
    const result = await provider.cancel(supplierRef);
    if (!result.success) throw new Error(`Supplier cancel failed for ref: ${supplierRef}`);
  }
}
