export interface Feeding {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  segments?: FeedingSegment[];
}

export interface FeedingSegment {
  id: string;
  feeding_id: string;
  breast: 'left' | 'right';
  started_at: string;
  ended_at: string | null;
}

export interface FeedingWithSegments extends Feeding {
  segments: FeedingSegment[];
}

export interface BreastSummary {
  left: number; // seconds
  right: number; // seconds
}
