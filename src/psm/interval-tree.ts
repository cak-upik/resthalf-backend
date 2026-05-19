export interface Interval {
  id: string;
  startTime: Date;
  endTime: Date;
  entityId: string;
}

interface AugmentedNode {
  interval: Interval;
  maxEndTime: Date; // Patent Claim 15 — subtree max-end-time metadata
  left?: AugmentedNode;
  right?: AugmentedNode;
}

export class AugmentedIntervalTree {
  private root?: AugmentedNode;
  private _size = 0;
  // O(1) lookup by ID — needed for remove()
  private intervalMap = new Map<string, Interval>();
  get size() {
    return this._size;
  }

  admit(interval: Interval): boolean {
    if (this.hasOverlap(interval.startTime, interval.endTime)) return false;
    this.root = this._insert(this.root, interval);
    this.intervalMap.set(interval.id, interval);
    this._size++;
    return true;
  }

  hasOverlap(start: Date, end: Date): boolean {
    return this._checkOverlap(this.root, start, end);
  }

  private _checkOverlap(
    node: AugmentedNode | undefined,
    start: Date,
    end: Date,
  ): boolean {
    if (!node) return false;
    if (start < node.interval.endTime && end > node.interval.startTime)
      return true;
    // Pruning: left subtree max end <= start means nothing there overlaps
    if (node.left && node.left.maxEndTime > start)
      if (this._checkOverlap(node.left, start, end)) return true;
    return this._checkOverlap(node.right, start, end);
  }

  private _insert(
    node: AugmentedNode | undefined,
    iv: Interval,
  ): AugmentedNode {
    if (!node) return { interval: iv, maxEndTime: iv.endTime };
    if (iv.startTime < node.interval.startTime)
      node.left = this._insert(node.left, iv);
    else node.right = this._insert(node.right, iv);
    this._updateMax(node);
    return node;
  }

  // ★ Fixed: proper two-child deletion via inorder successor
  remove(id: string): boolean {
    const interval = this.intervalMap.get(id);
    if (!interval) return false;
    this.root = this._remove(this.root, interval);
    this.intervalMap.delete(id);
    this._size--;
    return true;
  }

  private _remove(
    node: AugmentedNode | undefined,
    iv: Interval,
  ): AugmentedNode | undefined {
    if (!node) return undefined;
    if (iv.id === node.interval.id) {
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      const succ = this._minNode(node.right);
      node.interval = succ.interval;
      node.right = this._remove(node.right, succ.interval);
    } else if (iv.startTime < node.interval.startTime) {
      node.left = this._remove(node.left, iv);
    } else {
      node.right = this._remove(node.right, iv);
    }
    if (!node) return undefined;
    this._updateMax(node);
    return node;
  }

  private _minNode(node: AugmentedNode): AugmentedNode {
    while (node.left) node = node.left;
    return node;
  }

  private _updateMax(node: AugmentedNode) {
    node.maxEndTime = node.interval.endTime;
    if (node.left?.maxEndTime > node.maxEndTime)
      node.maxEndTime = node.left.maxEndTime;
    if (node.right?.maxEndTime > node.maxEndTime)
      node.maxEndTime = node.right.maxEndTime;
  }

  getAll(): Interval[] {
    const r: Interval[] = [];
    this._inorder(this.root, r);
    return r;
  }

  private _inorder(n: AugmentedNode | undefined, out: Interval[]) {
    if (!n) return;
    this._inorder(n.left, out);
    out.push(n.interval);
    this._inorder(n.right, out);
  }
  
  clear() {
    this.root = undefined;
    this._size = 0;
    this.intervalMap.clear();
  }
}
