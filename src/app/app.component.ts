import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <router-outlet />

    @if (isLoggedIn()) {
      <nav class="nav-bar" [class.collapsed]="isMenuCollapsed" aria-label="Main navigation">
        <button class="nav-handle" (click)="toggleMenu()" aria-label="Toggle Menu">
          <div class="handle-bar"></div>
        </button>
        <div class="nav-content">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
           class="nav-item" id="nav-home" aria-label="Dashboard">
          <span class="nav-icon">🏠</span>
          <span>Home</span>
        </a>
        <a routerLink="/history" routerLinkActive="active"
           class="nav-item" id="nav-history" aria-label="History">
          <span class="nav-icon">📅</span>
          <span>History</span>
        </a>
        <button class="nav-item" (click)="signOut()" id="nav-signout" aria-label="Sign out">
          <span class="nav-icon">🚪</span>
          <span>Sign Out</span>
        </button>
        </div>
      </nav>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AppComponent {
  private supabase = inject(SupabaseService);
  isLoggedIn = computed(() => !!this.supabase.user());
  isMenuCollapsed = true;

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
  }
}
