import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as crypto from "crypto";
import {
  WholesaleProvider,
  WholesaleSearchParams,
  WholesaleHotelResult,
} from "../wholesale.interface";

@Injectable()
export class HotelbedsProvider implements WholesaleProvider {
  readonly name = "HOTELBEDS";
  private readonly MARKUP = 10;
  private get BASE() {
    return this.config.get(
      "HOTELBEDS_BASE_URL",
      "https://api.test.hotelbeds.com/hotel-api/1.0",
    );
  }
  constructor(private config: ConfigService) {}

  async search(params: WholesaleSearchParams): Promise<WholesaleHotelResult[]> {
    try {
      const resp = await axios.post(
        `${this.BASE}/hotels`,
        {
          stay: { checkIn: params.checkIn, checkOut: params.checkOut },
          occupancies: [{ rooms: 1, adults: params.adults, children: 0 }],
          destination: { code: this.cityToIATA(params.city) },
          filter: { maxHotels: 50, minCategory: 2, maxCategory: 5 },
        },
        { headers: this.getHeaders() },
      );
      return (resp.data?.hotels?.hotels ?? []).map((h: any) => {
        const rate = h.rooms?.[0]?.rates?.[0];
        const netRate = parseFloat(rate?.net ?? "0");
        return {
          supplier: "HOTELBEDS" as const,
          supplierHotelId: String(h.code),
          supplierRateKey: rate?.rateKey ?? "",
          hotelName: h.name,
          starRating: parseInt(h.categoryCode ?? "0"),
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          nights: params.nights,
          netRate,
          sellingRate: Math.ceil(netRate * (1 + this.MARKUP / 100)),
          currency: rate?.currency ?? "USD",
          isRefundable: (rate?.cancellationPolicies?.length ?? 0) > 0,
          cancellationDeadline: rate?.cancellationPolicies?.[0]?.from,
        };
      });
    } catch {
      return [];
    }
  }

  async book(rateKey: string, guest: any) {
    try {
      const resp = await axios.post(
        `${this.BASE}/bookings`,
        {
          holder: { name: guest.firstName, surname: guest.lastName },
          rooms: [
            {
              rateKey,
              paxes: [
                {
                  roomId: 1,
                  type: "AD",
                  name: guest.firstName,
                  surname: guest.lastName,
                },
              ],
            },
          ],
          clientReference: `RH-${Date.now()}`,
        },
        { headers: this.getHeaders() },
      );
      const ref = resp.data?.booking?.reference;
      return ref
        ? { success: true, supplierRef: ref }
        : { success: false, supplierRef: "" };
    } catch {
      return { success: false, supplierRef: "" };
    }
  }

  async cancel(supplierRef: string) {
    const resp = await axios.delete(`${this.BASE}/bookings/${supplierRef}`, {
      headers: this.getHeaders(),
    });
    return { success: resp.data?.booking?.status === "CANCELLED" };
  }

  private getHeaders() {
    const ts = Math.floor(Date.now() / 1000).toString();
    const apiKey = this.config.get("HOTELBEDS_API_KEY");
    const secret = this.config.get("HOTELBEDS_SECRET");
    const sig = crypto
      .createHash("sha256")
      .update(`${apiKey}${secret}${ts}`)
      .digest("hex");
    return {
      "Api-key": apiKey,
      "X-Signature": sig,
      "Content-Type": "application/json",
    };
  }
  
  private cityToIATA(city: string): string {
    const map: Record<string, string> = {
      Jakarta: "CGK",
      Bali: "DPS",
      Surabaya: "SUB",
      Yogyakarta: "JOG",
      Bandung: "BDO",
      "Kuala Lumpur": "KUL",
    };
    return map[city] ?? "CGK";
  }
}
