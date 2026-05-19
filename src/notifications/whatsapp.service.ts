import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Guest } from "../guests/guest.entity";

import axios from "axios";

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  constructor(
    @InjectRepository(Guest) private guestRepo: Repository<Guest>,
    private config: ConfigService
) {}

  async sendRaw(to: string, body: string) {
    const phoneId = this.config.get("WHATSAPP_PHONE_ID");
    const token = this.config.get("WHATSAPP_TOKEN");
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        { messaging_product: "whatsapp", to, type: "text", text: { body } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      this.logger.error("WhatsApp send failed:", err.response?.data);
    }
  }

  async sendBookingConfirmation(booking: any) {
    const msg =
      "Booking Confirmed for " +
      booking.guestName +
      " Room: " +
      booking.roomNumber +
      " In: " +
      booking.startTime +
      " Out: " +
      booking.endTime;
    await this.sendRaw(booking.guestPhone, msg);
    await this.sendRaw(booking.hotelWhatsapp, msg);
  }

  async sendCheckoutReminder(
    delegationId: string,
    minsLeft: number,
  ): Promise<void> {
    try {
      // Fetch guest phone via delegation → booking → guest join
      const result = await this.guestRepo?.query?.(
        `
SELECT g.phone, r.room_number FROM delegation_records d
JOIN bookings b ON b.id = (
SELECT id FROM bookings WHERE delegation_id = $1 LIMIT 1)
JOIN guests g ON g.id = b.guest_id
JOIN rooms r ON r.id = d.room_id
WHERE d.id = $1`,
        [delegationId],
      );
      if (!result?.length) return;
      const { phone, room_number } = result[0];
      const urgency = minsLeft <= 15 ? "URGENT: " : "";
      await this.sendRaw(
        phone,
        `${urgency}*${minsLeft} minutes remaining* in Room ${room_number}.\n` +
          "Please prepare to check out or extend your stay in the app.",
      );
    } catch (err) {
      this.logger.error("sendCheckoutReminder failed:", err);
    }
  }

  async sendCleaningAlert(room: { roomNumber: string; hotelWhatsapp: string }) {
    await this.sendRaw(
      room.hotelWhatsapp,
      ` *Room ${room.roomNumber} ready for cleaning.*\nGuest confirmed departed.`,
    );
  }
}
