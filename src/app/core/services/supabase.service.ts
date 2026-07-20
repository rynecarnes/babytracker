import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User, AuthError, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { signal, Signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient;
  private _user = signal<User | null>(null);

  readonly user: Signal<User | null> = this._user.asReadonly();

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });

    // Restore session on init
    this.client.auth.getSession().then(({ data }) => {
      this._user.set(data.session?.user ?? null);
    });

    // Keep signal in sync with auth changes
    this.client.auth.onAuthStateChange((_event, session) => {
      this._user.set(session?.user ?? null);
    });
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  async signInWithEmail(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  /**
   * Subscribe to realtime changes on a table.
   * Returns the channel so the caller can unsubscribe on destroy.
   */
  subscribeToTable(
    channelName: string,
    table: string,
    filter: string | undefined,
    callback: (payload: any) => void
  ): RealtimeChannel {
    let channel = this.client.channel(channelName).on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table, filter },
      callback
    );
    channel.subscribe();
    return channel;
  }

  removeChannel(channel: RealtimeChannel): void {
    this.client.removeChannel(channel);
  }
}
