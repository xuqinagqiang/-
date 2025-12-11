
export interface Equipment {
  id: string;
  name: string;
  type: string; // e.g., Motor, Pump, Gearbox
  location: string;
  lubricant: string; // e.g., Grease #2, ISO VG 68
  cycleDays: number;
  lastLubricated: string; // ISO Date YYYY-MM-DD
  nextLubricated: string; // ISO Date YYYY-MM-DD
  capacity: string; // e.g., 50g, 2L
  notes?: string;
}

export interface LubeRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  date: string;
  performedBy: string;
  notes: string;
}

export interface LubeInventory {
  id: string;
  name: string; // e.g. "Shell Gadus S2 V220 2"
  type: string; // Grease, Oil
  stock: number;
  unit: string; // kg, L, barrel
  minThreshold: number;
}

export interface StockTransaction {
  id: string;
  inventoryId: string;
  inventoryName: string;
  type: 'IN' | 'OUT'; // 入库 | 领用
  amount: number;
  date: string; // ISO Date Time
  user: string;
}

export interface SOPCategory {
  id: string;
  name: string;
  description?: string;
}

export interface SOPDocument {
  id: string;
  categoryId: string;
  title: string;
  content: string; // Markdown or plain text
  updatedAt: string;
}

export type ViewState = 'dashboard' | 'inventory' | 'schedule' | 'history' | 'assistant' | 'stock' | 'sop';

export enum Priority {
  OK = 'OK',
  DUE_SOON = 'DUE_SOON',
  DUE = 'DUE',
  OVERDUE = 'OVERDUE'
}
