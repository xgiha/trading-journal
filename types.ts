export interface SystemLog {
  id: string;
  event: string;
  detail: string;
  time: string;
  iconType: 'lock' | 'motion' | 'wifi' | 'system';
}

export interface UpcomingEvent {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  iconType: 'moon' | 'water';
}

export interface RoomStatus {
  id: string;
  name: string;
  status: string;
  active: boolean;
  type: 'temp' | 'light';
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  pair: string;
  type: 'Long' | 'Short';
  pnl: number;
  
  // Journal Details
  entryTime: string; // HH:mm
  exitTime?: string; // HH:mm
  entryPrice?: number;
  exitPrice?: number;
  size?: string;
  fee?: number;
  
  // News Trade
  newsEvent?: string; // If defined, it's a news trade
  
  image?: string; // Base64 or URL (Legacy support)
  images?: string[]; // Multiple images support
  
  notes?: string; // Free text notes
}

export interface DayStats {
  date: string;
  trades: number;
  pnl: number;
}