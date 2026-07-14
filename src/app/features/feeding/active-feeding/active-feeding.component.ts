import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FeedingService } from '../../../core/services/feeding.service';
import { TimerDisplayComponent } from '../../../shared/components/timer-display/timer-display.component';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-active-feeding',
  standalone: true,
  imports: [TimerDisplayComponent, DurationPipe],
  template: `
    <div class="feeding-page">
      <!-- Header -->
      <header class="feeding-header">
        <button class="btn btn-ghost btn-icon" (click)="goBack()" aria-label="Go back" id="btn-back">‹</button>
        <h1 class="feeding-title">Active Feeding</h1>
        <div style="width:3rem"></div>
      </header>

      @if (feedingService.activeFeeding(); as feeding) {
        <!-- Total Timer -->
        <section class="total-timer-section">
          <p class="timer-label">Total Time</p>
          <app-timer-display
            [seconds]="feedingService.activeFeedingElapsedSeconds()"
            [active]="true"
            style="--timer-size: 5rem"
          />
        </section>

        <!-- Breast Selector -->
        <section class="breast-section">
          <p class="section-title">Currently Feeding</p>

          <div class="breast-grid">
            <!-- LEFT -->
            <button
              class="breast-btn"
              [class.breast-active]="feedingService.currentBreast() === 'left'"
              [class.breast-inactive]="feedingService.currentBreast() === 'right'"
              (click)="switchTo('left')"
              id="btn-breast-left"
              aria-label="Switch to left breast"
            >
              <div class="breast-pulse-ring" [class.visible]="feedingService.currentBreast() === 'left'"></div>
              <div class="breast-icon">👈</div>
              <div class="breast-name">Left</div>
              <div class="breast-time">{{ feedingService.breastElapsed().left | duration:'short' }}</div>
            </button>

            <!-- RIGHT -->
            <button
              class="breast-btn"
              [class.breast-active]="feedingService.currentBreast() === 'right'"
              [class.breast-inactive]="feedingService.currentBreast() === 'left'"
              (click)="switchTo('right')"
              id="btn-breast-right"
              aria-label="Switch to right breast"
            >
              <div class="breast-pulse-ring" [class.visible]="feedingService.currentBreast() === 'right'"></div>
              <div class="breast-icon">👉</div>
              <div class="breast-name">Right</div>
              <div class="breast-time">{{ feedingService.breastElapsed().right | duration:'short' }}</div>
            </button>
          </div>

          <!-- Switch hint -->
          <p class="switch-hint">Tap the other side to switch</p>
        </section>

        <!-- Segment breakdown -->
        <section class="segments-section">
          <p class="section-title">Session Breakdown</p>
          <div class="segments-bars">
            <div class="bar-row">
              <span class="bar-label">Left</span>
              <div class="bar-track">
                <div
                  class="bar-fill bar-left"
                  [style.width.%]="leftPercent"
                ></div>
              </div>
              <span class="bar-time">{{ feedingService.breastElapsed().left | duration:'short' }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">Right</span>
              <div class="bar-track">
                <div
                  class="bar-fill bar-right"
                  [style.width.%]="rightPercent"
                ></div>
              </div>
              <span class="bar-time">{{ feedingService.breastElapsed().right | duration:'short' }}</span>
            </div>
          </div>
        </section>

        <!-- End Feeding -->
        <div class="end-section">
          <button class="btn btn-danger btn-lg end-btn" (click)="endFeeding()" id="btn-end-feeding">
            ✓ End Feeding
          </button>
        </div>
      } @else {
        <!-- No active feeding -->
        <div class="no-feeding">
          <p>No feeding in progress.</p>
          <button class="btn btn-primary" (click)="goBack()" id="btn-go-home">Go to Dashboard</button>
        </div>
      }
    </div>
  `,
  styleUrl: './active-feeding.component.css'
})
export class ActiveFeedingComponent {
  feedingService = inject(FeedingService);
  private router = inject(Router);

  get leftPercent(): number {
    const { left, right } = this.feedingService.breastElapsed();
    const total = left + right;
    return total > 0 ? Math.round((left / total) * 100) : 50;
  }

  get rightPercent(): number {
    return 100 - this.leftPercent;
  }

  async switchTo(breast: 'left' | 'right'): Promise<void> {
    if (this.feedingService.currentBreast() === breast) return;
    await this.feedingService.switchBreast(breast);
  }

  async endFeeding(): Promise<void> {
    await this.feedingService.endFeeding();
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
