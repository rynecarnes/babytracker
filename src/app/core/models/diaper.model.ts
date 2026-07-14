export type DiaperType = 'pee' | 'poop' | 'both';

export interface DiaperChange {
  id: string;
  user_id: string;
  changed_at: string;
  type: DiaperType;
  created_at: string;
}

export interface DailyDiaperSummary {
  pee: number;
  poop: number;
  both: number;
  total: number;
}
