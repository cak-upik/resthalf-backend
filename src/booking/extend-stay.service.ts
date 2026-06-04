import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DelegationRecord } from "../delegation/delegation.entity";
import { LedgerService } from "../ledger/ledger.service";
import { PaymentService } from "../payment/payment.service";
import { Room } from "../rooms/room.entity";
import { PELService } from "../pel/pel.service";

@Injectable()
export class ExtendStayService {
  constructor(
    @InjectRepository(DelegationRecord)
    private delegations: Repository<DelegationRecord>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    private ledger: LedgerService,
    private payment: PaymentService,
    private pel: PELService,
  ) {}

  async initiateExtend(
    delegationId: string,
    guestId: string,
    extraHours: 12 | 24,
  ) {
    const d = await this.delegations.findOne({
      where: { id: delegationId, status: "ACTIVE" },
    });
    if (!d) throw new BadRequestException("No active stay found");
    if (d.designatedEntityId !== guestId)
      throw new BadRequestException("Not authorised");
    const newEnd = new Date(d.endTime.getTime() + extraHours * 3600000);
    const room = await this.rooms.findOneOrFail({ where: { id: d.roomId } });
    const price = extraHours === 12 ? +room.basePriceH12 : +room.basePriceH24;
    // PEL validates the extension window against any following booking
    const pel = await this.pel.validateAndLock({
      roomId: d.roomId,
      requestedStart: d.endTime,
      requestedEnd: newEnd,
      requestingEntityId: guestId,
      isDesignatedEntity: true,
    });
    if (!pel.allowed)
      throw new BadRequestException({
        code: "EXTENSION_CONFLICT",
        reason: pel.reason,
      });
    await this.pel.releaseLock(pel.lockKey!);
    const orderId = `RH-EXT-${delegationId.slice(0, 8)}-${Date.now()}`;
    const snap = await this.payment.createSnapToken({
      orderId,
      amount: price,
      guestName: "Guest",
      description: `Extend stay ${extraHours}h`,
    });
    return {
      orderId,
      snapToken: snap.token,
      redirectUrl: snap.redirectUrl,
      price,
      newEnd,
    };
  }

  async confirmExtend(delegationId: string, newEnd: Date) {
    await this.delegations.update(delegationId, { endTime: newEnd });
    await this.ledger.append({
      delegationId,
      eventType: "AUTHORITY_ISSUED",
      eventData: { extended: true, newEnd },
      actor: "system",
    });
  }
}
