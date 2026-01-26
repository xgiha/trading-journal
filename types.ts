
export interface Trade {
  id: string;
  accountId: string; // New field to link trade to an account
  date: string; // YYYY-MM-DD
  pair: string;
  type: 'Long' | 'Short';
  pnl: number;
  
  // Journal Details
  entryTime: string; // HH:mm:ss
  exitTime?: string; // HH:mm:ss
  entryPrice?: number;
  exitPrice?: number;
  size?: string;
  fee?: number;
  
  // News Trade
  newsEvent?: string; // If defined, it's a news trade
  
  // Strategy
  strategy?: string;
  
  image?: string; // Base64 or URL (Legacy support)
  images?: string[]; // Multiple images support
  
  notes?: string; // Free text notes
}

export interface PayoutRecord {
  id: string;
  accountId: string; // New field
  amount: number;
  date: string;
}

export type AccountType = 'COMBINE' | 'EXPRESS';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: number;
}
