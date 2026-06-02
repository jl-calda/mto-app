import type { Warning } from '@/lib/types';

/** Accumulator threaded through the pipeline (kept internal — no I/O). */
export class WarningSink {
  private readonly list: Warning[] = [];
  push(w: Warning): void {
    this.list.push(w);
  }
  all(): Warning[] {
    return this.list.slice();
  }
}
