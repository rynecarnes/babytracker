import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <div class="auth-page">
      <div class="auth-card glass-card">
        <div class="auth-logo">🍼</div>
        <h1 class="auth-title">Baby Tracker</h1>
        <p class="auth-subtitle">Track feedings and diaper changes with ease.</p>

        @if (!emailSent()) {
          <form class="auth-form" (submit)="sendLink($event)">
            <div class="input-group">
              <label class="input-label" for="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                class="auth-input"
                placeholder="you@example.com"
                [(value)]="email"
                (input)="email = $any($event.target).value"
                required
                autocomplete="email"
              />
            </div>
            <button
              class="btn btn-primary btn-lg"
              type="submit"
              [disabled]="loading()"
              id="btn-send-link"
              style="width:100%"
            >
              @if (loading()) { Sending… } @else { Send Magic Link }
            </button>
            @if (error()) {
              <p class="auth-error">{{ error() }}</p>
            }
          </form>
        } @else {
          <div class="email-sent">
            <div class="sent-icon">✉️</div>
            <p class="sent-title">Check your email!</p>
            <p class="sent-sub">We sent a sign-in link to <strong>{{ email }}</strong></p>
            <button class="btn btn-ghost" (click)="emailSent.set(false)" id="btn-try-again">Try a different email</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-lg);
      background: var(--color-bg);
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -5%, hsla(260, 60%, 30%, 0.3), transparent),
        radial-gradient(ellipse 50% 40% at 80% 100%, hsla(200, 60%, 20%, 0.2), transparent);
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 2.5rem 2rem;
      text-align: center;
    }
    .auth-logo {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .auth-logo { animation: none; }
    }
    .auth-title {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg in oklch, var(--color-primary), hsl(200, 85%, 65%));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    .auth-subtitle {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-bottom: 2rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: left;
    }
    .input-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .input-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .auth-input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: var(--surface-glass);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      color: var(--color-text-primary);
      font-size: 1rem;
      font-family: 'Outfit', sans-serif;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      outline: none;
    }
    .auth-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px hsla(260, 70%, 72%, 0.2);
    }
    .auth-error {
      font-size: 0.85rem;
      color: var(--color-danger);
      text-align: center;
    }
    .email-sent { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .sent-icon { font-size: 3rem; }
    .sent-title { font-size: 1.2rem; font-weight: 700; }
    .sent-sub { font-size: 0.9rem; color: var(--color-text-muted); }
  `]
})
export class AuthComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  email = '';
  emailSent = signal(false);
  loading = signal(false);
  error = signal('');

  async sendLink(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.email.trim()) return;

    this.loading.set(true);
    this.error.set('');

    const { error } = await this.supabase.signInWithEmail(this.email.trim());

    this.loading.set(false);

    if (error) {
      this.error.set(error.message);
    } else {
      this.emailSent.set(true);
    }
  }
}
