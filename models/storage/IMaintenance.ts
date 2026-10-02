import type { MaintainedStore } from '../database/maintenance-functions';

export interface IMaintenance {
  /** When the last full maintenance pass finished. */
  lastCompleted?: number;
  /** Where a paused maintenance pass continues. */
  resume?: {
    store: MaintainedStore;
    /** Key of the last handled record, or undefined to start at the beginning of the store. */
    after?: [number, number];
  };
}
