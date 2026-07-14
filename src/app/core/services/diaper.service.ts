import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DiaperChange, DailyDiaperSummary, DiaperType } from '../models/diaper.model';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class DiaperService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private db = this.supabase.supabase;

  private _todayChanges = signal<DiaperChange[]>([]);
  private _channel: RealtimeChannel | null = null;

  readonly todayChanges = this._todayChanges.asReadonly();

  readonly todaySummary = computed<DailyDiaperSummary>(() => {
    const changes = this._todayChanges();
    const pee = changes.filter((c) => c.type === 'pee').length;
    const poop = changes.filter((c) => c.type === 'poop').length;
    const both = changes.filter((c) => c.type === 'both').length;
    return { pee, poop, both, total: pee + poop + both };
  });

  constructor() {
    this.loadTodayChanges();
    this.subscribeRealtime();
  }

  private async loadTodayChanges(): Promise<void> {
    const userId = this.supabase.user()?.id;
    if (!userId) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data } = await this.db
      .from('diaper_changes')
      .select('*')
      .eq('user_id', userId)
      .gte('changed_at', start.toISOString())
      .lte('changed_at', end.toISOString())
      .order('changed_at', { ascending: false });

    if (data) this._todayChanges.set(data as DiaperChange[]);
  }

  private subscribeRealtime(): void {
    const userId = this.supabase.user()?.id;
    if (!userId) return;

    this._channel = this.supabase.subscribeToTable(
      'diaper-realtime',
      'diaper_changes',
      `user_id=eq.${userId}`,
      () => this.loadTodayChanges()
    );
  }

  async logDiaperChange(type: DiaperType): Promise<void> {
    const userId = this.supabase.user()?.id;
    if (!userId) return;

    const now = new Date().toISOString();
    const { data } = await this.db
      .from('diaper_changes')
      .insert({ user_id: userId, changed_at: now, type })
      .select()
      .single();

    if (data) {
      this._todayChanges.update((changes) => [data as DiaperChange, ...changes]);
    }
  }

  async getDiaperChangesForDate(date: Date): Promise<DiaperChange[]> {
    const userId = this.supabase.user()?.id;
    if (!userId) return [];

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data } = await this.db
      .from('diaper_changes')
      .select('*')
      .eq('user_id', userId)
      .gte('changed_at', start.toISOString())
      .lte('changed_at', end.toISOString())
      .order('changed_at', { ascending: false });

    return (data ?? []) as DiaperChange[];
  }

  ngOnDestroy(): void {
    if (this._channel) this.supabase.removeChannel(this._channel);
  }
}
