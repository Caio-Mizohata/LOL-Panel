import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy, DetachedRouteHandle } from '@angular/router';
import { SummonerCache } from './summoner-cache';

// Cache de dados para a rota do perfil do invocador
@Injectable()
export class ProfileRouteReuseStrategy extends BaseRouteReuseStrategy {
  private readonly cache = inject(SummonerCache);

  override shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.path?.startsWith('profile') ?? false;
  }

  override store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (this.shouldDetach(route)) {
      this.cache.storeProfileHandle(this.getRouteKey(route), handle);
    }
  }

  override shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.cache.hasProfileHandle(this.getRouteKey(route));
  }

  override retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.cache.getProfileHandle(this.getRouteKey(route));
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string {
    const path = route.routeConfig?.path ?? '';
    const id = route.paramMap.get('id') ?? '';
    const puuid = route.paramMap.get('puuid') ?? '';

    return `${path}|${id}|${puuid}`;
  }
}
