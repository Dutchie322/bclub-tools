export interface IMaintenance {
  /** When the last full scan of the member database finished. */
  lastCompleted?: number;
  /** Key of the last scanned member when a scan was paused. */
  resumeAfter?: [number, number];
}
