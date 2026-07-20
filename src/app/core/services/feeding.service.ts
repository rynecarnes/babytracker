import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Feeding, FeedingSegment, FeedingWithSegments } from '../models/feeding.model';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class FeedingService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private db = this.supabase.supabase;

  // Active feeding state
  private _activeFeeding = signal<FeedingWithSegments | null>(null);
  private _currentBreast = signal<'left' | 'right' | null>(null);
  private _lastFeeding = signal<FeedingWithSegments | null>(null);
  private _recentFeedings = signal<FeedingWithSegments[]>([]);
  private _tick = signal<number>(Date.now()); // clock ticker
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _channel: RealtimeChannel | null = null;

  readonly activeFeeding = this._activeFeeding.asReadonly();
  readonly currentBreast = this._currentBreast.asReadonly();
  readonly lastFeeding = this._lastFeeding.asReadonly();
  readonly recentFeedings = this._recentFeedings.asReadonly();

  /** Elapsed seconds for the full active feeding session */
  readonly activeFeedingElapsedSeconds = computed(() => {
    this._tick(); // depend on tick
    const feeding = this._activeFeeding();
    if (!feeding) return 0;
    return Math.floor((Date.now() - new Date(feeding.started_at).getTime()) / 1000);
  });

  /** Per-breast elapsed seconds for the active feeding */
  readonly breastElapsed = computed<{ left: number; right: number }>(() => {
    this._tick();
    const feeding = this._activeFeeding();
    if (!feeding) return { left: 0, right: 0 };
    const now = Date.now();
    return feeding.segments.reduce(
      (acc, seg) => {
        const end = seg.ended_at ? new Date(seg.ended_at).getTime() : now;
        const secs = Math.floor((end - new Date(seg.started_at).getTime()) / 1000);
        acc[seg.breast] += secs;
        return acc;
      },
      { left: 0, right: 0 }
    );
  });

  /** Seconds since the last feeding started (null if never fed) */
  readonly secondsSinceLastFeeding = computed(() => {
    this._tick();
    const last = this._lastFeeding();
    if (!last?.started_at) return null;
    return Math.floor((Date.now() - new Date(last.started_at).getTime()) / 1000);
  });

  constructor() {
    this.initData();
    this.startTick();
    this.subscribeRealtime();
  }

  private startTick(): void {
    this._tickInterval = setInterval(() => this._tick.set(Date.now()), 1000);
  }

  private async initData(): Promise<void> {
    const userId = this.supabase.user()?.id;
    if (!userId) return;

    // Check for any feeding with no ended_at (in progress)
    const { data: active } = await this.db
      .from('feedings')
      .select('*, segments:feeding_segments(*)')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (active) {
      this._activeFeeding.set(active as FeedingWithSegments);
      const activeSegment = (active.segments as FeedingSegment[]).find((s: FeedingSegment) => !s.ended_at);
      this._currentBreast.set(activeSegment?.breast ?? null);
    }

    // Load last completed feeding
    const { data: last } = await this.db
      .from('feedings')
      .select('*, segments:feeding_segments(*)')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(1)
      .single();

    if (last) this._lastFeeding.set(last as FeedingWithSegments);

    // Load recent feedings for history
    await this.loadRecentFeedings();
  }

  private subscribeRealtime(): void {
    const userId = this.supabase.user()?.id;
    if (!userId) return;

    this._channel = this.supabase.subscribeToTable(
      'feedings-realtime',
      'feedings',
      `user_id=eq.${userId}`,
      () => this.initData()
    );
  }

  async startFeeding(breast: 'left' | 'right'): Promise<void> {
    const userId = this.supabase.user()?.id;
    if (!userId) return;

    const now = new Date().toISOString();

    const { data: feeding, error: feedingError } = await this.db
      .from('feedings')
      .insert({ user_id: userId, started_at: now })
      .select()
      .single();

    if (feedingError || !feeding) return;

    const { data: segment } = await this.db
      .from('feeding_segments')
      .insert({ feeding_id: feeding.id, breast, started_at: now })
      .select()
      .single();

    this._activeFeeding.set({ ...feeding, segments: segment ? [segment] : [] });
    this._currentBreast.set(breast);
  }

  async switchBreast(newBreast: 'left' | 'right'): Promise<void> {
    const feeding = this._activeFeeding();
    if (!feeding) return;

    const now = new Date().toISOString();

    // Close the current open segment
    const openSeg = feeding.segments.find((s) => !s.ended_at);
    if (openSeg) {
      await this.db
        .from('feeding_segments')
        .update({ ended_at: now })
        .eq('id', openSeg.id);
    }

    // Open new segment
    const { data: newSeg } = await this.db
      .from('feeding_segments')
      .insert({ feeding_id: feeding.id, breast: newBreast, started_at: now })
      .select()
      .single();

    if (!newSeg) return;

    const updatedSegments = feeding.segments.map((s) =>
      s.id === openSeg?.id ? { ...s, ended_at: now } : s
    );
    updatedSegments.push(newSeg);

    this._activeFeeding.set({ ...feeding, segments: updatedSegments });
    this._currentBreast.set(newBreast);
  }

  async endFeeding(): Promise<void> {
    const feeding = this._activeFeeding();
    if (!feeding) return;

    const now = new Date().toISOString();

    // Close open segment
    const openSeg = feeding.segments.find((s) => !s.ended_at);
    if (openSeg) {
      await this.db
        .from('feeding_segments')
        .update({ ended_at: now })
        .eq('id', openSeg.id);
    }

    // Close feeding
    await this.db
      .from('feedings')
      .update({ ended_at: now })
      .eq('id', feeding.id);

    const completed: FeedingWithSegments = {
      ...feeding,
      ended_at: now,
      segments: feeding.segments.map((s) =>
        s.id === openSeg?.id ? { ...s, ended_at: now } : s
      ),
    };

    this._lastFeeding.set(completed);
    this._activeFeeding.set(null);
    this._currentBreast.set(null);
    await this.loadRecentFeedings();
  }

  async loadRecentFeedings(): Promise<void> {
    const userId = this.supabase.user()?.id;
    if (!userId) return;

    const { data } = await this.db
      .from('feedings')
      .select('*, segments:feeding_segments(*)')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(50);

    if (data) this._recentFeedings.set(data as FeedingWithSegments[]);
  }

  async getFeedingsForDate(date: Date): Promise<FeedingWithSegments[]> {
    const userId = this.supabase.user()?.id;
    if (!userId) return [];

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data } = await this.db
      .from('feedings')
      .select('*, segments:feeding_segments(*)')
      .eq('user_id', userId)
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString())
      .order('started_at', { ascending: false });

    return (data ?? []) as FeedingWithSegments[];
  }

  ngOnDestroy(): void {
    if (this._tickInterval) clearInterval(this._tickInterval);
    if (this._channel) this.supabase.removeChannel(this._channel);
  }
}
