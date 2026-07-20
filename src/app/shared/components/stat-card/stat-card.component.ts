import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="stat-card" [style.--accent]="accentColor">
      <div class="stat-icon">{{ icon }}</div>
      <div class="stat-body">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.25rem;
      padding: 1rem 0.5rem;
      text-align: center;
      background: var(--surface-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }
    .stat-icon {
      font-size: 2rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      align-items: center;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--accent, var(--color-primary));
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
  `]
})
export class StatCardComponent {
  @Input() icon: string = '';
  @Input() value: string = '';
  @Input() label: string = '';
  @Input() accentColor: string = 'var(--color-primary)';
}
