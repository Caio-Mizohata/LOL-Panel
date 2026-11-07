import { Injectable, signal } from '@angular/core';
import { DetachedRouteHandle } from '@angular/router';
import { RiotPlayerProfile } from '../../models/riot.models';

// Cache de dados do invocador
@Injectable({ providedIn: 'root' })
export class SummonerCache {
  readonly profile = signal<RiotPlayerProfile | null>(null);
  readonly gameName = signal('');
  readonly tagLine = signal('');

  private readonly profileHandles = new Map<string, DetachedRouteHandle>();
  
  storeProfileHandle(key: string, handle: DetachedRouteHandle): void {
    this.profileHandles.set(key, handle);
  }

  hasProfileHandle(key: string): boolean {
    return this.profileHandles.has(key);
  }

  getProfileHandle(key: string): DetachedRouteHandle | null {
    return this.profileHandles.get(key) ?? null;
  }
}
