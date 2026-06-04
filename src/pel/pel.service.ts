import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { DelegationRecord } from "../delegation/delegation.entity";
import { PSMEngine } from "../psm/psm.engine";
import { LedgerService } from "../ledger/ledger.service";

export interface TemporalRequest {
  roomId: string;
  requestedStart: Date;
  requestedEnd: Date;
  requestingEntityId: string;
  isDesignatedEntity: boolean; // ★ Patent: non-designated → terminate path
}

@Injectable()
export class PELService {
  private readonly logger = new Logger(PELService.name);
  private readonly LOCK_TTL = 30; // seconds

  constructor(
    @InjectRepository(DelegationRecord)
    private delegationRepo: Repository<DelegationRecord>,
    private psm: PSMEngine,
    private ledger: LedgerService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async validateAndLock(req: TemporalRequest): Promise<{
    allowed: boolean;
    reason: string;
    delegationId?: string;
    lockKey?: string;
  }> {
    // 1. Find overlapping active delegations
    const active = await this.delegationRepo
      .createQueryBuilder("d")
      .where("d.room_id = :r", { r: req.roomId })
      .andWhere("d.status = 'ACTIVE'")
      .andWhere("d.start_time < :e", { e: req.requestedEnd })
      .andWhere("d.end_time > :s", { s: req.requestedStart })
      .getMany();
    if (active.length === 0)
      return { allowed: true, reason: "NO_ACTIVE_DELEGATION" };

    const delegation = active[0];
    // 2. Patent core: non-designated entity → terminate execution path
    if (!req.isDesignatedEntity) {
      await this.ledger.append({
        roomId: req.roomId,
        delegationId: delegation.id,
        eventType: "EXECUTION_PATH_TERMINATED",
        eventData: { requestingEntity: req.requestingEntityId },
        actor: "pel",
      });
      return {
        allowed: false,
        reason: "EXECUTION_PATH_TERMINATED_NON_DESIGNATED",
        delegationId: delegation.id,
      };
    }

    // 3. Redis atomic slot lock — prevents race condition on concurrent bookings
    const lockKey = `lock:room:${req.roomId}:${req.requestedStart.getTime()}`;
    const acquired = await this.redis.set(
      lockKey,
      req.requestingEntityId,
      "EX",
      this.LOCK_TTL,
      "NX",
    );
    if (!acquired)
      return {
        allowed: false,
        reason: "LOCK_CONTENTION",
        delegationId: delegation.id,
      };

    // 4. PSM overlap check
    const psmResult = await this.psm.validateAndAccept(
      req.roomId,
      delegation.id,
      req.requestedStart,
      req.requestedEnd,
      req.requestingEntityId,
    );
    if (!psmResult.admitted) {
      await this.redis.del(lockKey); // ★ Release lock on PSM rejection
      return {
        allowed: false,
        reason: `PSM_REJECTED: ${psmResult.reason}`,
        delegationId: delegation.id,
      };
    }
    return {
      allowed: true,
      reason: "PSM_ADMITTED",
      delegationId: delegation.id,
      lockKey,
    };
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.redis.del(lockKey);
  }

  // Patent section 2.1 — inject temporal exclusion predicates before query planning
  async rewriteAvailabilityQuery(
    roomId: string,
    start: Date,
    end: Date,
  ): Promise<string> {
    const active = await this.delegationRepo.find({
      where: { roomId, status: "ACTIVE" },
    });
    if (active.length === 0) return "";
    return active
      .map(
        (d) =>
          `NOT (start_time < '${d.endTime.toISOString()}' AND end_time > '${d.startTime.toISOString()}')`,
      )
      .join(" AND ");
  }
}
