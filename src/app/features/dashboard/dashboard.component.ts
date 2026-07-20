import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FeedingService } from '../../core/services/feeding.service';
import { DiaperService } from '../../core/services/diaper.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { TotalDurationPipe, BreastTimePipe } from '../../core/models/feeding.pipes';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCardComponent, DurationPipe, DatePipe, TotalDurationPipe, BreastTimePipe, RouterLink],
  template: `
    <div class="page-container">
      <!-- Header -->
      <header class="dash-header">
        <div>
          <h1 class="dash-title">Baby Tracker</h1>
          <p class="dash-subtitle">{{ today | date:'EEEE, MMMM d' }}</p>
        </div>
        <div class="dash-baby-icon">🍼</div>
      </header>

      <!-- Time Since Last Feeding Hero -->
      <section class="last-feeding-hero glass-card" [class.alert]="isOverdue">
        <div class="hero-label">Time Since Last Feeding</div>
        <div class="hero-time" [class.overdue]="isOverdue">
          {{ feedingService.secondsSinceLastFeeding() | duration:'short' }}
        </div>
        @if (feedingService.lastFeeding(); as last) {
          <div class="hero-sub">
            Last fed at {{ last.started_at | date:'h:mm a' }}
            · {{ last | totalDuration | duration:'short' }}
          </div>
        } @else {
          <div class="hero-sub">No feedings recorded yet</div>
        }
      </section>

      <!-- Quick Actions -->
      <section class="quick-actions">
        @if (!feedingService.activeFeeding()) {
          <button class="btn btn-primary btn-lg action-btn" (click)="startFeeding()" id="btn-start-feeding">
            <span>🤱</span> Start Feeding
          </button>
        } @else {
          <button class="btn btn-lg action-btn feeding-active" (click)="goToFeeding()" id="btn-resume-feeding">
            <span class="active-dot"></span>
            Feeding in Progress ·
            {{ feedingService.activeFeedingElapsedSeconds() | duration:'short' }}
          </button>
        }
        <button class="btn btn-ghost btn-lg action-btn" (click)="openDiaperLog()" id="btn-log-diaper">
          <span>🧷</span> Log Diaper
        </button>
      </section>

      <!-- Diaper Summary Today -->
      <section>
        <div class="section-header">
          <span class="section-title">Today's Diapers</span>
          <span class="badge">{{ diaperService.todaySummary().total }} total</span>
        </div>
        <div class="diaper-summary-grid">
          <app-stat-card
            icon="💧"
            [value]="diaperService.todaySummary().pee.toString()"
            label="Pee"
            [accentColor]="'var(--color-pee)'"
          />
          <app-stat-card
            icon="💩"
            [value]="diaperService.todaySummary().poop.toString()"
            label="Poop"
            [accentColor]="'var(--color-poop)'"
          />
          <app-stat-card
            icon="🌊"
            [value]="diaperService.todaySummary().both.toString()"
            label="Both"
            [accentColor]="'var(--color-both)'"
          />
        </div>
      </section>

      <!-- Recent Feedings -->
      <section class="recent-section">
        <div class="section-header">
          <span class="section-title">Recent Feedings</span>
          <a routerLink="/history" class="section-link">See all</a>
        </div>
        <div class="recent-list">
          @for (feeding of feedingService.recentFeedings().slice(0, 3); track feeding.id) {
            <div class="recent-row glass-card">
              <div class="recent-time">{{ feeding.started_at | date:'h:mm a' }}</div>
              <div class="recent-detail">
                <span class="breast-tag left">L {{ feeding | breastTime:'left' | duration:'short' }}</span>
                <span class="breast-tag right">R {{ feeding | breastTime:'right' | duration:'short' }}</span>
              </div>
              <div class="recent-total">{{ feeding | totalDuration | duration:'short' }}</div>
            </div>
          } @empty {
            <div class="empty-state">No feedings yet today</div>
          }
        </div>
      </section>

      <!-- Diaper Log Modal -->
      @if (showDiaperLog) {
        <div class="modal-backdrop" (click)="closeDiaperLog()" id="diaper-modal-backdrop">
          <div class="diaper-sheet" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Log diaper change">
            <div class="sheet-handle"></div>
            <h2 class="sheet-title">Log Diaper Change</h2>
            <div class="diaper-buttons">
              <button class="diaper-btn pee" (click)="logDiaper('pee')" id="btn-diaper-pee">
                <span class="diaper-emoji">💧</span>
                <span class="diaper-label">Pee</span>
              </button>
              <button class="diaper-btn poop" (click)="logDiaper('poop')" id="btn-diaper-poop">
                <span class="diaper-emoji">💩</span>
                <span class="diaper-label">Poop</span>
              </button>
              <button class="diaper-btn both" (click)="logDiaper('both')" id="btn-diaper-both">
                <span class="diaper-emoji">🌊</span>
                <span class="diaper-label">Both</span>
              </button>
            </div>
            <button class="btn btn-ghost" style="width:100%;margin-top:0.75rem" (click)="closeDiaperLog()">Cancel</button>
          </div>
        </div>
      }

      <!-- Start Feeding Breast Picker -->
      @if (showBreastPicker) {
        <div class="modal-backdrop" (click)="cancelBreastPick()" id="breast-picker-backdrop">
          <div class="diaper-sheet" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Start feeding">
            <div class="sheet-handle"></div>
            <h2 class="sheet-title">Which breast?</h2>
            <div class="breast-buttons">
              <button class="breast-pick-btn left" (click)="beginFeeding('left')" id="btn-pick-left">
                <span class="diaper-emoji">←</span>
                <span class="diaper-label">Left</span>
              </button>
              <button class="breast-pick-btn right" (click)="beginFeeding('right')" id="btn-pick-right">
                <span class="diaper-emoji">→</span>
                <span class="diaper-label">Right</span>
              </button>
            </div>
            <button class="btn btn-ghost" style="width:100%;margin-top:0.75rem" (click)="cancelBreastPick()">Cancel</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  feedingService = inject(FeedingService);
  diaperService = inject(DiaperService);
  private router = inject(Router);

  today = new Date();
  showDiaperLog = false;
  showBreastPicker = false;

  get isOverdue(): boolean {
    const secs = this.feedingService.secondsSinceLastFeeding();
    return secs !== null && secs > 3 * 3600; // > 3 hours
  }

  startFeeding(): void {
    this.showBreastPicker = true;
  }

  cancelBreastPick(): void {
    this.showBreastPicker = false;
  }

  async beginFeeding(breast: 'left' | 'right'): Promise<void> {
    this.showBreastPicker = false;
    await this.feedingService.startFeeding(breast);
    this.router.navigate(['/feeding']);
  }

  goToFeeding(): void {
    this.router.navigate(['/feeding']);
  }

  openDiaperLog(): void {
    this.showDiaperLog = true;
  }

  closeDiaperLog(): void {
    this.showDiaperLog = false;
  }

  async logDiaper(type: 'pee' | 'poop' | 'both'): Promise<void> {
    await this.diaperService.logDiaperChange(type);
    this.showDiaperLog = false;
  }
}
