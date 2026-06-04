import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(private config: ConfigService) {}
  private getAuthHeader() {
    const key = this.config.get("MIDTRANS_SERVER_KEY");
    return `Basic ${Buffer.from(key + ":").toString("base64")}`;
  }
  private get BASE() {
    const prod = this.config.get("MIDTRANS_IS_PRODUCTION") === "true";
    return prod
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";
  }

  async createSnapToken(booking: {
    orderId: string;
    amount: number;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    description: string;
  }) {
    const resp = await axios.post(
      `${this.BASE}/snap/v1/transactions`,
      {
        transaction_details: {
          order_id: booking.orderId,
          gross_amount: booking.amount,
        },
        customer_details: {
          first_name: booking.guestName,
          email: booking.guestEmail,
          phone: booking.guestPhone,
        },
        item_details: [
          {
            id: booking.orderId,
            price: booking.amount,
            quantity: 1,
            name: booking.description,
          },
        ],
      },
      {
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
      },
    );
    return { token: resp.data.token, redirectUrl: resp.data.redirect_url };
  }

  // Verify webhook signature
  verifyWebhook(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    sig: string,
  ) {
    const crypto = require("crypto");
    const serverKey = this.config.get("MIDTRANS_SERVER_KEY");
    const expected = crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");
    return expected === sig;
  }

  async refund(orderId: string, amount: number, reason: string) {
    const auth = this.getAuthHeader();
    const apiBase =
      this.config.get("MIDTRANS_IS_PRODUCTION") === "true"
        ? "https://api.midtrans.com/v2"
        : "https://api.sandbox.midtrans.com/v2";
    // Step 1: fetch transaction status to get transaction_id
    const status = await axios.get(`${apiBase}/${orderId}/status`, {
      headers: { Authorization: auth },
    });
    const transactionId = status.data.transaction_id;
    if (!transactionId)
      throw new Error("Transaction not found for order: " + orderId);
    // Step 2: issue refund
    const resp = await axios.post(
      `${apiBase}/${transactionId}/refund`,
      {
        refund_key: `REFUND-${orderId}-${Date.now()}`, // idempotency key
        amount: Math.round(amount),
        reason,
      },
      { headers: { Authorization: auth, "Content-Type": "application/json" } },
    );
    if (resp.data.status_code !== "200") {
      throw new Error(`Midtrans refund failed: ${resp.data.status_message}`);
    }
    return {
      refundKey: resp.data.refund_key,
      amount,
      status: resp.data.transaction_status,
    };
  }
}
