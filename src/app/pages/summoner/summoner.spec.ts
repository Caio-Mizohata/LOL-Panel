import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RiotPlayerProfile } from '../../models/riot.models';
import { Riot } from '../../services/riot';
import { SummonerCache } from '../../services/cache/summoner-cache';
import { Summoner } from './summoner';

const profile: RiotPlayerProfile = {
  account: { puuid: 'test-puuid', gameName: 'Jogador Teste', tagLine: 'BR1' },
  summoner: { profileIconId: 1, revisionDate: 0, summonerLevel: 100 },
  masteries: [],
  profileIconUrl: null,
  ranks: [],
};

describe('Summoner', () => {
  let component: Summoner;
  let fixture: ComponentFixture<Summoner>;
  let riot: { getPlayerProfile: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    riot = { getPlayerProfile: vi.fn(() => of(profile)) };

    await TestBed.configureTestingModule({
      imports: [Summoner],
      providers: [{ provide: Riot, useValue: riot }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Summoner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exibe apenas a busca antes de qualquer requisição', () => {
    expect(riot.getPlayerProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('input[type="search"]').length).toBe(2);
    expect(fixture.nativeElement.querySelector('app-cards')).toBeNull();
  });

  it('busca pelo nome e tagline e exibe o card retornado', () => {
    component.searchPlayer('  Jogador Teste  ', '  BR1  ');
    fixture.detectChanges();

    expect(riot.getPlayerProfile).toHaveBeenCalledOnce();
    expect(riot.getPlayerProfile).toHaveBeenCalledWith('Jogador Teste', 'BR1');
    expect(component.profile()).toEqual(profile);
    expect(fixture.nativeElement.querySelector('app-cards')).toBeTruthy();
  });

  it('valida o formato do Riot ID sem chamar a API', () => {
    component.searchPlayer('Jogador sem tagline', '');
    fixture.detectChanges();

    expect(riot.getPlayerProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'nome do jogador e a tagline',
    );
  });

  it('preserva o card quando o componente da busca é recriado', () => {
    component.searchPlayer('Jogador Teste', 'BR1');
    fixture.destroy();

    const newFixture = TestBed.createComponent(Summoner);
    newFixture.detectChanges();

    expect(TestBed.inject(SummonerCache).profile()).toEqual(profile);
    expect(newFixture.componentInstance.profile()).toEqual(profile);
    expect(newFixture.nativeElement.querySelector('app-cards')).toBeTruthy();

    const inputs = (newFixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[type="search"]',
    );
    expect(inputs[0]?.value).toBe('Jogador Teste');
    expect(inputs[1]?.value).toBe('BR1');
  });
});
