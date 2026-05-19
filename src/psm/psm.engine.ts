import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AugmentedIntervalTree, Interval } from "./interval-tree";
import { AdmittedInterval } from "./admitted-interval.entity";

@Injectable()
export class PSMEngine {
  // ★ Compound key: roomId:delegationId — not just roomId
  private trees = new Map<string, AugmentedIntervalTree>();
  private readonly logger = new Logger(PSMEngine.name);

  constructor() {}

  @InjectRepository(AdmittedInterval)
  private repo: Repository<AdmittedInterval>;

  // Reconstruct from DB on server restart
  async reconstruct(roomId: string, delegationId: string): Promise<void> {
    const rows = await this.repo.find({ where: { roomId, delegationId } });
    const tree = new AugmentedIntervalTree();
    for (const r of rows)
      tree.admit({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        entityId: r.id,
      });
    this.trees.set(this.key(roomId, delegationId), tree);
    this.logger.log(
      `PSM reconstructed [${delegationId}]: ${rows.length} intervals`,
    );
  }

  async validateAndAccept(
    roomId: string,
    delegationId: string,
    start: Date,
    end: Date,
    entityId: string,
  ): Promise<{ admitted: boolean; reason?: string; intervalId?: string }> {
    const k = this.key(roomId, delegationId);
    let tree = this.trees.get(k);
    if (!tree) {
      await this.reconstruct(roomId, delegationId);
      tree = this.trees.get(k) ?? new AugmentedIntervalTree();
      this.trees.set(k, tree);
    }
    if (tree.hasOverlap(start, end))
      return { admitted: false, reason: "TEMPORAL_OVERLAP" };
    const intervalId = crypto.randomUUID();
    tree.admit({ id: intervalId, startTime: start, endTime: end, entityId });
    // Persist — survives restart
    await this.repo.save({
      id: intervalId,
      roomId,
      delegationId,
      startTime: start,
      endTime: end,
    });
    return { admitted: true, intervalId };
  }

  getAdmitted(roomId: string, delegationId: string): Interval[] {
    return this.trees.get(this.key(roomId, delegationId))?.getAll() ?? [];
  }

  destroyTree(roomId: string, delegationId: string): void {
    this.trees.delete(this.key(roomId, delegationId));
  }
  
  private key(roomId: string, delegationId: string) {
    return `${roomId}:${delegationId}`;
  }
}
