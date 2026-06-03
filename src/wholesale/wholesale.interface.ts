export interface WholesaleSearchParams {
  city: string;
  countryCode: string;
  checkIn: string;
  checkOut: string; // YYYY-MM-DD
  nights: number;
  adults: number;
  currency: string;
}

export interface WholesaleHotelResult {
  supplier: "TBO" | "HOTELBEDS" | "RATEHAWK";
  supplierHotelId: string;
  supplierRateKey: string;
  hotelName: string;
  starRating: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  netRate: number;
  sellingRate: number;
  currency: string;
  isRefundable: boolean;
  cancellationDeadline?: string;
}

// Every provider implements this — swap without changing core
export interface WholesaleProvider {
  readonly name: string;
  search(p: WholesaleSearchParams): Promise<WholesaleHotelResult[]>;
  book(
    rateKey: string,
    guest: any,
  ): Promise<{ success: boolean; supplierRef: string; failureReason?: string }>;
  cancel(supplierRef: string): Promise<{ success: boolean }>;
}
