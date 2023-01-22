import Dexie, { Table } from "dexie";

export interface Cycle {
  id?: number;
  start: string;
  duration: string;
  title: string;
}

export class Store extends Dexie {
  cycles!: Table<Cycle>;

  constructor() {
    super("store");
    this.version(1).stores({
      cycles: "++id",
    });
  }
}

export const store = new Store();
