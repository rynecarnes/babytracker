import { Component, inject, signal, computed } from '@angular/core';
import { FeedingService } from '../../core/services/feeding.service';
import { DiaperService } from '../../core/services/diaper.service';
import { FeedingWithSegments } from '../../core/models/feeding.model';
import { DiaperChange } from '../../core/models/diaper.model';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DurationPipe, DatePipe, TitleCasePipe],
  template: `
    <div class="page-container">
      <header class="history-header">
        <h1 class="history-title">History</h1>
      </header>

      <!-- Date Navigation Strip -->
      <div class="date-strip">
        <button class="date-nav-btn" (click)="prevDay()" aria-label="Previous day" id="btn-prev-day">‹</button>
        <div class="date-display">
          <span class="date-weekday">{{ selectedDate() | date:'EEEE' }}</span>
          <span class="date-full">{{ selectedDate() | date:'MMMM d, yyyy' }}</span>
        </div>
        <button
          class="date-nav-btn"
          (click)="nextDay()"
          [disabled]="isToday()"
          [class.disabled]="isToday()"
          aria-label="Next day"
          id="btn-next-day"
        >›</button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="skeleton-list">
          @for (_ of [1,2,3]; track $index) {
            <div class="skeleton" style="height: 72px; margin-bottom: 0.5rem;"></div>
          }
        </div>
      } @else {
        <!-- Feeding Summary for the day -->
        <section class="history-section">
          <div class="section-header">
            <span class="section-title">Feedings</span>
            <span class="badge">{{ feedings().length }}</span>
          </div>

          @if (feedings().length === 0) {
            <div class="empty-day">No feedings recorded</div>
          } @else {
            <div class="history-list">
              @for (feeding of feedings(); track feeding.id) {
                <div class="history-card glass-card">
                  <div class="history-card-left">
                    <div class="history-time">{{ feeding.started_at | date:'h:mm a' }}</div>
                    <div class="history-duration">{{ totalFeedingSeconds(feeding) | duration:'short' }}</div>
                  </div>
                  <div class="history-card-right">
                    <div class="breast-breakdown">
                      <span class="breast-chip left-chip">
                        👈 L · {{ leftSeconds(feeding) | duration:'short' }}
                      </span>
                      <span class="breast-chip right-chip">
                        👉 R · {{ rightSeconds(feeding) | duration:'short' }}
                      </span>
                    </div>
                    @if (feeding.ended_at) {
                      <div class="history-ended">Ended {{ feeding.ended_at | date:'h:mm a' }}</div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <div class="divider"></div>

        <!-- Diaper Summary for the day -->
        <section class="history-section">
          <div class="section-header">
            <span class="section-title">Diapers</span>
            <span class="badge">{{ diapers().length }}</span>
          </div>

          @if (diapers().length === 0) {
            <div class="empty-day">No diaper changes recorded</div>
          } @else {
            <div class="diaper-count-row">
              <div class="diaper-count-chip pee-chip">💧 {{ peeCount() }} Pee</div>
              <div class="diaper-count-chip poop-chip">💩 {{ poopCount() }} Poop</div>
              <div class="diaper-count-chip both-chip">🌊 {{ bothCount() }} Both</div>
            </div>

            <div class="history-list">
              @for (change of diapers(); track change.id) {
                <div class="history-card glass-card diaper-row">
                  <span class="diaper-icon-lg">
                    {{ change.type === 'pee' ? '💧' : change.type === 'poop' ? '💩' : '🌊' }}
                  </span>
                  <div>
                    <div class="diaper-type-label" [class]="change.type + '-label'">
                      {{ change.type | titlecase }}
                    </div>
                    <div class="history-time">{{ change.changed_at | date:'h:mm a' }}</div>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styleUrl: './history.component.css'
})
export class HistoryComponent {
  private feedingService = inject(FeedingService);
  private diaperService = inject(DiaperService);

  selectedDate = signal(new Date());
  feedings = signal<FeedingWithSegments[]>([]);
  diapers = signal<DiaperChange[]>([]);
  loading = signal(false);

  peeCount = computed(() => this.diapers().filter((d) => d.type === 'pee').length);
  poopCount = computed(() => this.diapers().filter((d) => d.type === 'poop').length);
  bothCount = computed(() => this.diapers().filter((d) => d.type === 'both').length);

  constructor() {
    this.loadDay(this.selectedDate());
  }

  isToday(): boolean {
    const today = new Date();
    const sel = this.selectedDate();
    return (
      sel.getFullYear() === today.getFullYear() &&
      sel.getMonth() === today.getMonth() &&
      sel.getDate() === today.getDate()
    );
  }

  async prevDay(): Promise<void> {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
    await this.loadDay(d);
  }

  async nextDay(): Promise<void> {
    if (this.isToday()) return;
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
    await this.loadDay(d);
  }

  private async loadDay(date: Date): Promise<void> {
    this.loading.set(true);
    const [f, d] = await Promise.all([
      this.feedingService.getFeedingsForDate(date),
      this.diaperService.getDiaperChangesForDate(date),
    ]);
    this.feedings.set(f);
    this.diapers.set(d);
    this.loading.set(false);
  }

  totalFeedingSeconds(feeding: FeedingWithSegments): number {
    if (!feeding.ended_at) return 0;
    return Math.floor(
      (new Date(feeding.ended_at).getTime() - new Date(feeding.started_at).getTime()) / 1000
    );
  }

  leftSeconds(feeding: FeedingWithSegments): number {
    return feeding.segments
      .filter((s) => s.breast === 'left' && s.ended_at)
      .reduce(
        (acc, s) =>
          acc + Math.floor((new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()) / 1000),
        0
      );
  }

  rightSeconds(feeding: FeedingWithSegments): number {
    return feeding.segments
      .filter((s) => s.breast === 'right' && s.ended_at)
      .reduce(
        (acc, s) =>
          acc + Math.floor((new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()) / 1000),
        0
      );
  }
}
