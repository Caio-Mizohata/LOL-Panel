import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Riot } from '../../../services/riot';
import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let mockRiot: {
    getPlayerProfile: ReturnType<typeof vi.fn>;
    getPlayerProfileByPuuid: ReturnType<typeof vi.fn>;
    getMatchesByPuuid: ReturnType<typeof vi.fn>;
    getDataPlayerMatch: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const mockProfileData = {
      account: { puuid: 'test-puuid', gameName: 'Faker', tagLine: 'KR1' },
      summoner: { profileIconId: 1, revisionDate: 0, summonerLevel: 500 },
      masteries: [],
      profileIconUrl: 'https://example.com/icon.png',
      ranks: [
        { queueType: 'RANKED_SOLO_5x5', tier: 'CHALLENGER', rank: 'I', wins: 100, losses: 50 },
        { queueType: 'RANKED_FLEX_SR', tier: 'MASTER', rank: 'I', wins: 20, losses: 10 },
      ],
    };

    mockRiot = {
      getPlayerProfile: vi.fn().mockReturnValue(of(mockProfileData)),
      getPlayerProfileByPuuid: vi.fn().mockReturnValue(of(mockProfileData)),
      getMatchesByPuuid: vi.fn().mockReturnValue(of([])),
      getDataPlayerMatch: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Riot, useValue: mockRiot },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch ranked queue stats', () => {
    component.selectQueue('flex');
    expect(component.activeQueue()).toBe('flex');
  });

  it('should render player details when profile is loaded by puuid', async () => {
    fixture.componentRef.setInput('puuid', 'test-puuid');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockRiot.getPlayerProfileByPuuid).toHaveBeenCalledWith('test-puuid');
    expect(component.profile()?.account.gameName).toBe('Faker');
    expect(component.currentStats()?.rank).toBe('CHALLENGER I');

    const header = fixture.nativeElement.querySelector('#player-name');
    expect(header?.textContent).toContain('Faker');
    expect(header?.textContent).toContain('#KR1');
  });

  it('should render player details when profile is loaded by Riot ID slug', async () => {
    fixture.componentRef.setInput('id', 'Faker-KR1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockRiot.getPlayerProfile).toHaveBeenCalledWith('Faker', 'KR1');
    expect(component.profile()?.account.gameName).toBe('Faker');
    expect(component.currentStats()?.rank).toBe('CHALLENGER I');

    const header = fixture.nativeElement.querySelector('#player-name');
    expect(header?.textContent).toContain('Faker');
    expect(header?.textContent).toContain('#KR1');
  });

  it('should fallback to PUUID lookup when id input is a raw puuid', async () => {
    fixture.componentRef.setInput('id', 'long-puuid-sample-without-tag-format-1234567890');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockRiot.getPlayerProfileByPuuid).toHaveBeenCalledWith(
      'long-puuid-sample-without-tag-format-1234567890',
    );
    expect(component.profile()?.account.gameName).toBe('Faker');
  });

  it('should display average kills, deaths and assists per champion match', async () => {
    const soloMatchIds = new Subject<string[]>();
    mockRiot.getMatchesByPuuid.mockImplementation((_puuid: string, queue: number) =>
      queue === 420 ? soloMatchIds.asObservable() : of([]),
    );
    mockRiot.getDataPlayerMatch.mockImplementation((matchId: string) =>
      of({
        metadata: { dataVersion: '2', matchId, participants: ['test-puuid'] },
        info: {
          queueId: 420,
          participants: [
            {
              puuid: 'test-puuid',
              win: matchId === 'match-1',
              championId: 1,
              championName: 'Annie',
              teamPosition: 'MIDDLE',
              kills: matchId === 'match-1' ? 6 : 4,
              deaths: matchId === 'match-1' ? 2 : 4,
              assists: matchId === 'match-1' ? 8 : 6,
            },
          ],
        },
      }),
    );

    fixture.componentRef.setInput('id', 'Faker-KR1');
    fixture.detectChanges();
    await fixture.whenStable();

    soloMatchIds.next(['match-1', 'match-2']);
    soloMatchIds.complete();
    fixture.detectChanges();

    expect(component.currentStats()?.champions[0]?.kda).toBe('5 / 3 / 7');
    expect(fixture.nativeElement.textContent).toContain('5 / 3 / 7');
  });
});
