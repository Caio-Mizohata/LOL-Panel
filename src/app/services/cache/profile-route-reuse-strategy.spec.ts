import { TestBed } from '@angular/core/testing';
import { convertToParamMap, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ProfileRouteReuseStrategy } from './profile-route-reuse-strategy';

describe('ProfileRouteReuseStrategy', () => {
  const route = (path: string, id?: string) =>
    ({
      routeConfig: { path },
      paramMap: convertToParamMap(id ? { id } : {}),
    }) as Parameters<RouteReuseStrategy['shouldDetach']>[0];

  it('reutiliza somente o perfil correspondente ao mesmo jogador', () => {
    const strategy = TestBed.runInInjectionContext(() => new ProfileRouteReuseStrategy());
    const fakerRoute = route('profile/:id', 'Faker-KR1');
    const anotherRoute = route('profile/:id', 'Outro-BR1');
    const handle = {} as DetachedRouteHandle;

    expect(strategy.shouldDetach(fakerRoute)).toBe(true);
    strategy.store(fakerRoute, handle);

    expect(strategy.shouldAttach(fakerRoute)).toBe(true);
    expect(strategy.retrieve(fakerRoute)).toBe(handle);
    expect(strategy.shouldAttach(anotherRoute)).toBe(false);
    expect(strategy.shouldDetach(route(''))).toBe(false);
  });
});
