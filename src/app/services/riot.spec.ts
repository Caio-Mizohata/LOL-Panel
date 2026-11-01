import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Riot } from './riot';
import { RiotPlayerProfile } from '../models/riot.models';

describe('Riot', () => {
  let service: Riot;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Riot);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('resolves the Riot ID before loading the profile and top three masteries', () => {
    const profile: RiotPlayerProfile = {
      account: { gameName: 'João Silva', tagLine: 'BR1', puuid: 'test-puuid' },
      ranks: [{ queueType: 'RANKED_SOLO_5x5', tier: 'EMERALD', rank: 'IV', wins: 4, losses: 8 }],
      summoner: { profileIconId: 29, summonerLevel: 245, revisionDate: 1764551153000 },
      profileIconUrl: 'https://ddragon.leagueoflegends.com/cdn/99.1.1/img/profileicon/29.png',
      masteries: [
        {
          championName: 'Nome retornado pela Riot',
          championIconUrl:
            'https://ddragon.leagueoflegends.com/cdn/99.1.1/img/champion/ReturnedChampion.png',
          championId: 24,
          championLevel: 13,
          championPoints: 161196,
          lastPlayTime: 1764551153000,
          championPointsSinceLastLevel: 52596,
          championPointsUntilNextLevel: -41596,
        },
      ],
    };
    let result: RiotPlayerProfile | undefined;
    service.getPlayerProfile(' João Silva ', ' BR1 ').subscribe((value) => (result = value));
    http.expectNone('/api/riot/summoners/by-puuid/test-puuid');
    http.expectOne('/api/riot/accounts/by-riot-id/Jo%C3%A3o%20Silva/BR1').flush(profile.account);
    const summoner = http.expectOne('/api/riot/summoners/by-puuid/test-puuid');
    const masteries = http.expectOne(
      '/api/riot/champion-masteries/by-puuid/test-puuid/top?count=3',
    );
    expect(masteries.request.method).toBe('GET');
    expect(masteries.request.headers.has('X-Riot-Token')).toBe(false);
    http.expectOne('/api/riot/league/entries/by-puuid/test-puuid').flush(profile.ranks);
    summoner.flush(profile.summoner);
    expect(result).toBeUndefined();
    masteries.flush(
      profile.masteries.map(({ championName, championIconUrl, ...mastery }) => mastery),
    );
    http.expectOne('https://ddragon.leagueoflegends.com/api/versions.json').flush(['99.1.1']);
    http
      .expectOne('https://ddragon.leagueoflegends.com/cdn/99.1.1/data/pt_BR/champion.json')
      .flush({
        data: {
          ReturnedChampion: {
            key: '24',
            name: 'Nome retornado pela Riot',
            image: { full: 'ReturnedChampion.png' },
          },
        },
      });
    expect(result).toEqual(profile);
  });

  it('preserves player data when rank and champion catalog are unavailable', () => {
    let result: RiotPlayerProfile | undefined;
    service.getPlayerProfile('Player', 'BR1').subscribe((value) => (result = value));
    http.expectOne('/api/riot/accounts/by-riot-id/Player/BR1').flush({
      gameName: 'Player',
      tagLine: 'BR1',
      puuid: 'id',
    });
    http
      .expectOne('/api/riot/league/entries/by-puuid/id')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    http.expectOne('/api/riot/summoners/by-puuid/id').flush({
      profileIconId: 123,
      summonerLevel: 55,
      revisionDate: 1764551153000,
    });
    http.expectOne('/api/riot/champion-masteries/by-puuid/id/top?count=3').flush([
      {
        championId: 999,
        championLevel: 7,
        championPoints: 12345,
        lastPlayTime: 1764551153000,
        championPointsSinceLastLevel: 500,
        championPointsUntilNextLevel: 1000,
      },
    ]);
    http
      .expectOne('https://ddragon.leagueoflegends.com/api/versions.json')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(result?.summoner.summonerLevel).toBe(55);
    expect(result?.masteries[0].championPoints).toBe(12345);
    expect(result?.masteries[0].championName).toBeNull();
    expect(result?.profileIconUrl).toBeNull();
    expect(result?.ranks).toBeNull();
  });

  it('keeps rank and win-loss counts separately for each queue', () => {
    let result: unknown;
    service.getRanks('id/encoded').subscribe((ranks) => (result = ranks));
    http.expectOne('/api/riot/league/entries/by-puuid/id%2Fencoded').flush([
      {
        queueType: 'RANKED_SOLO_5x5',
        tier: 'EMERALD',
        rank: 'IV',
        leaguePoints: 91,
        wins: 4,
        losses: 8,
      },
      {
        queueType: 'RANKED_FLEX_SR',
        tier: 'DIAMOND',
        rank: 'II',
        leaguePoints: 18,
        wins: 57,
        losses: 61,
      },
      { queueType: 'OTHER_QUEUE', tier: 'GOLD', rank: 'I' },
    ]);
    expect(result).toEqual([
      { queueType: 'RANKED_SOLO_5x5', tier: 'EMERALD', rank: 'IV', wins: 4, losses: 8 },
      { queueType: 'RANKED_FLEX_SR', tier: 'DIAMOND', rank: 'II', wins: 57, losses: 61 },
    ]);
  });

  it('stops when the Riot ID cannot be found', () => {
    let status = 0;
    service
      .getPlayerProfile('Missing', 'BR1')
      .subscribe({ error: (error) => (status = error.status) });
    http
      .expectOne('/api/riot/accounts/by-riot-id/Missing/BR1')
      .flush({}, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
    http.expectNone((request) => request.url.includes('by-puuid'));
  });
});
