import { Component, Input } from '@angular/core';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-timer-display',
  standalone: true,
  imports: [],
  template: `
    <div class="timer-display" [class.timer-active]="active">
      <span class="timer-hh">{{ hh }}</span>
      <span class="timer-sep">:</span>
      <span class="timer-mm">{{ mm }}</span>
      <span class="timer-sep">:</span>
      <span class="timer-ss">{{ ss }}</span>
    </div>
  `,
  styles: [`
    .timer-display {
      display: inline-flex;
      align-items: baseline;
      gap: 2px;
      font-family: 'Outfit', sans-serif;
      font-size: var(--timer-size, 4rem);
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
    .timer-sep {
      opacity: 0.4;
      font-weight: 300;
      animation: blink 1s step-start infinite;
    }
    .timer-active .timer-sep {
      animation: blink 1s step-start infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.15; }
    }
    @media (prefers-reduced-motion: reduce) {
      .timer-sep { animation: none; opacity: 0.4; }
    }
  `]
})
export class TimerDisplayComponent {
  @Input() seconds: number = 0;
  @Input() active: boolean = false;

  get hh(): string {
    return String(Math.floor(this.seconds / 3600)).padStart(2, '0');
  }
  get mm(): string {
    return String(Math.floor((this.seconds % 3600) / 60)).padStart(2, '0');
  }
  get ss(): string {
    return String(this.seconds % 60).padStart(2, '0');
  }
}
