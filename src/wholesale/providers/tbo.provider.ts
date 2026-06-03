import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import {
  WholesaleProvider,
  WholesaleSearchParams,
  WholesaleHotelResult,
} from "../wholesale.interface";

@Injectable()
export class TBOProvider implements WholesaleProvider {
  readonly name = "TBO";
  private readonly BASE =
    "https://api.tbotechnology.in/TBOHolidays_HotelAPI/v1";
  private readonly MARKUP = 12;
  private readonly logger = new Logger(TBOProvider.name);
  constructor(private config: ConfigService) {}

  async search(params: WholesaleSearchParams): Promise<WholesaleHotelResult[]> {
    try {
      const resp = await axios.post(
        `${this.BASE}/Search`,
        {
          CheckIn: params.checkIn,
          CheckOut: params.checkOut,
          GuestNationality: "ID",
          PaxRooms: [{ Adults: params.adults, Children: 0 }],
          CityId: this.cityToCode(params.city),
          ResponseTime: 23,
          IsDetailedResponse: true,
        },
        { headers: this.getHeaders() },
      );
      const hotels = resp.data?.HotelSearchResult?.HotelResults ?? [];
      return hotels.slice(0, 50).map((h: any) => {
        const netRate = h.Rooms?.[0]?.TotalFare ?? 0;
        return {
          supplier: "TBO" as const,
          supplierHotelId: h.HotelCode,
          supplierRateKey: h.Rooms?.[0]?.RateKey ?? "",
          hotelName: h.HotelName,
          starRating: h.StarRating ?? 0,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          nights: params.nights,
          netRate,
          sellingRate: Math.ceil(netRate * (1 + this.MARKUP / 100)),
          currency: "IDR",
          isRefundable: h.Rooms?.[0]?.IsRefundable ?? false,
          cancellationDeadline: h.Rooms?.[0]?.LastCancellationDate,
        };
      });
    } catch (err) {
      this.logger.error("TBO search failed:", err.response?.data);
      return []; // fail gracefully — never block direct results
    }
  }

  async book(rateKey: string, guest: any) {
    try {
      const resp = await axios.post(
        `${this.BASE}/Book`,
        {
          RateKey: rateKey,
          BookingReferenceId: `RH-${Date.now()}`,
          Paxes: [
            {
              PaxType: "Adult",
              LeadPassenger: true,
              FirstName: guest.firstName,
              LastName: guest.lastName,
            },
          ],
        },
        { headers: this.getHeaders() },
      );
      const r = resp.data?.BookResult;
      return r?.Status?.Code === 200
        ? { success: true, supplierRef: r.TBOReferenceNumber }
        : {
            success: false,
            supplierRef: "",
            failureReason: r?.Status?.Description,
          };
    } catch {
      return { success: false, supplierRef: "" };
    }
  }

  async cancel(supplierRef: string) {
    const resp = await axios.post(
      `${this.BASE}/Cancel`,
      { BookingId: supplierRef },
      { headers: this.getHeaders() },
    );
    return { success: resp.data?.Status?.Code === 200 };
  }

  private cityToCode(city: string): string {
    const map: Record<string, string> = {
      Jakarta: "4413",
      Bali: "4394",
      Surabaya: "4440",
      Bandung: "4397",
      Yogyakarta: "4449",
      "Kuala Lumpur": "3953",
      Manila: "5000",
      Bangkok: "3549",
      Singapore: "3965",
    };
    return map[city] ?? "4413";
  }
  
  private getHeaders() {
    return {
      ClientId: this.config.get("TBO_CLIENT_ID"),
      Username: this.config.get("TBO_USERNAME"),
      Password: this.config.get("TBO_PASSWORD"),
    };
  }
}
