import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, shareReplay, switchMap, timeout } from 'rxjs';
import type { ChampionMastery, DataDragonCatalog, RiotAccount, RiotPlayerProfile, RiotRank, RiotSummoner, RiotMatchIds, RiotMatchData } from '../models/riot.models';


@Service()
export class Riot {
  private readonly http = inject(HttpClient);
  private readonly baseUrl: string = '/api/riot';
  private readonly dataDragonUrl: string = 'https://ddragon.leagueoflegends.com';

  private readonly championCatalog = this.http.get<string[]>(`${this.dataDragonUrl}/api/versions.json`)
    .pipe(switchMap((versions) => {
      const version = versions[0];
      if (!version) throw new Error('Versão do Data Dragon não disponível');
      return this.http.get<DataDragonCatalog>(`${this.dataDragonUrl}/cdn/${version}/data/pt_BR/champion.json`).pipe(
        map((catalog) => ({
          version,
          champions: new Map(Object.values(catalog.data).map((champion) => [Number(champion.key), champion])),
        })),
      );
    }),
      timeout(10000),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  getAccount(gameName: string, tagLine: string): Observable<RiotAccount> {
    return this.http.get<RiotAccount>(
      `${this.baseUrl}/accounts/by-riot-id/${encodeURIComponent(gameName.trim())}/${encodeURIComponent(tagLine.trim())}`,
    );
  }

  getAccountByPuuid(puuid: string): Observable<RiotAccount> {
    return this.http.get<RiotAccount>(
      `${this.baseUrl}/accounts/by-puuid/${encodeURIComponent(puuid.trim())}`,
    );
  }

  getSummoner(puuid: string): Observable<RiotSummoner> {
    return this.http.get<RiotSummoner>(
      `${this.baseUrl}/summoners/by-puuid/${encodeURIComponent(puuid)}`,
    );
  }

  getTopMasteries(puuid: string): Observable<ChampionMastery[]> {
    return this.http.get<ChampionMastery[]>(
      `${this.baseUrl}/champion-masteries/by-puuid/${encodeURIComponent(puuid)}/top`,
      { params: { count: 3 } },
    );
  }

  getRanks(puuid: string): Observable<RiotRank[]> {
    return this.http
      .get<RiotRank[]>(`${this.baseUrl}/league/entries/by-puuid/${encodeURIComponent(puuid)}`)
      .pipe(map((entries) => entries.filter(
        ({ queueType }) => queueType === 'RANKED_SOLO_5x5' || queueType === 'RANKED_FLEX_SR',
      ).map(({ queueType, tier, rank, wins, losses }) => ({
          queueType, tier,
          rank,
          wins,
          losses,
        })),
      ),
      );
  }

  getPlayerProfile(gameName: string, tagLine: string): Observable<RiotPlayerProfile> {
    return this.getAccount(gameName, tagLine).pipe(
      switchMap((account) =>
        forkJoin({
          summoner: this.getSummoner(account.puuid),
          masteries: this.getTopMasteries(account.puuid),
          ranks: this.getRanks(account.puuid).pipe(catchError(() => of(null))),
          catalog: this.championCatalog.pipe(catchError(() => of(null))),
        }).pipe(
          map(({ summoner, masteries, catalog, ranks }): RiotPlayerProfile => ({
            account,
            summoner,
            ranks,
            profileIconUrl: catalog ? `${this.dataDragonUrl}/cdn/${catalog.version}/img/profileicon/${summoner.profileIconId}.png` : null,
            masteries: masteries.map((mastery) => {
              const champion = catalog?.champions.get(mastery.championId);
              return {
                ...mastery,
                championName: champion?.name ?? null,
                championIconUrl: champion && catalog ? `${this.dataDragonUrl}/cdn/${catalog.version}/img/champion/${champion.image.full}` : null,
              };
            }),
          })),
        ),
      ),
    );
  }

  getPlayerProfileByPuuid(puuid: string): Observable<RiotPlayerProfile> {
    return this.getAccountByPuuid(puuid).pipe(
      switchMap((account) =>
        forkJoin({
          summoner: this.getSummoner(account.puuid),
          masteries: this.getTopMasteries(account.puuid),
          ranks: this.getRanks(account.puuid).pipe(catchError(() => of(null))),
          catalog: this.championCatalog.pipe(catchError(() => of(null))),
        }).pipe(
          map(({ summoner, masteries, catalog, ranks }): RiotPlayerProfile => ({
            account,
            summoner,
            ranks,
            profileIconUrl: catalog ? `${this.dataDragonUrl}/cdn/${catalog.version}/img/profileicon/${summoner.profileIconId}.png` : null,
            masteries: masteries.map((mastery) => {
              const champion = catalog?.champions.get(mastery.championId);
              return {
                ...mastery,
                championName: champion?.name ?? null,
                championIconUrl: champion && catalog ? `${this.dataDragonUrl}/cdn/${catalog.version}/img/champion/${champion.image.full}` : null,
              };
            }),
          })),
        ),
      ),
    );
  }

  getMatchesByPuuid(puuid: string, queue: 420 | 440): Observable<RiotMatchIds> {
    return this.http.get<RiotMatchIds>(
      `${this.baseUrl}/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`,
      { params: { queue: queue, type: 'ranked', start: 0, count: 10 } },
    );
  }

  getDataPlayerMatch(matchID: string): Observable<RiotMatchData> {
    return this.http.get<RiotMatchData>(`${this.baseUrl}/match/v5/matches/${encodeURIComponent(matchID)}`);
  }
}
