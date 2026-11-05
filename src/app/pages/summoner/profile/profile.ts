import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { ChampionStats, MatchHistoryItem, QueueId, QueueStats,RiotMatchData, RiotPlayerProfile, RiotRank } from '../../../models/riot.models';
import { Riot } from '../../../services/riot';

@Component({
  selector: 'app-profile',
  host: { class: 'block' },
  imports: [RouterLink, HlmCardImports, HlmProgressImports, HlmTableImports, HlmTabsImports],
  templateUrl: './profile.html',
})
export class Profile {
  private readonly riot = inject(Riot);
  private readonly kdaNumberFormatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  });

  readonly id = input<string>();
  readonly puuid = input<string>();

  readonly queues = [
    { id: 'solo' as const, label: 'Solo/Duo' },
    { id: 'flex' as const, label: 'Flex' },
  ] as const;

  readonly activeQueue = signal<QueueId>('solo');
  readonly profile = signal<RiotPlayerProfile | null>(null);
  readonly soloStats = signal<QueueStats | null>(null);
  readonly flexStats = signal<QueueStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly currentStats = computed<QueueStats | null>(() => {
    return this.activeQueue() === 'solo' ? this.soloStats() : this.flexStats();
  });

  constructor() {
    effect(() => {
      const idVal = this.id();
      const puuidVal = this.puuid();

      if (idVal) {
        this.loadByIdentifier(idVal);
      } else if (puuidVal) {
        this.loadByPuuid(puuidVal);
      }
    });
  }

  selectQueue(id: QueueId): void {
    this.activeQueue.set(id);
  }

  private loadByIdentifier(identifier: string): void {
    const lastDash = identifier.lastIndexOf('-');
    const isRiotId =
      lastDash > 0 &&
      lastDash < identifier.length - 1 &&
      identifier.length <= 30 &&
      /^[a-zA-Z0-9]{2,5}$/.test(identifier.slice(lastDash + 1));

    if (isRiotId) {
      const gameName = identifier.slice(0, lastDash);
      const tagLine = identifier.slice(lastDash + 1);
      this.loadByRiotId(gameName, tagLine);
    } else {
      this.loadByPuuid(identifier);
    }
  }

  private loadByRiotId(gameName: string, tagLine: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.riot.getPlayerProfile(gameName, tagLine).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.buildQueueStatsFromProfile(data);
        this.loadMatchHistory(data.account.puuid);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('[Profile] Erro ao carregar perfil por Riot ID:', err);
        this.error.set('Não foi possível carregar os dados do jogador.');
        this.loading.set(false);
      },
    });
  }

  private loadByPuuid(puuid: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.riot.getPlayerProfileByPuuid(puuid).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.buildQueueStatsFromProfile(data);
        this.loadMatchHistory(puuid);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('[Profile] Erro ao carregar perfil por PUUID:', err);
        this.error.set('Não foi possível carregar os dados do jogador.');
        this.loading.set(false);
      },
    });
  }

  private buildQueueStatsFromProfile(data: RiotPlayerProfile): void {
    const soloEntry = data.ranks?.find((r) => r.queueType === 'RANKED_SOLO_5x5');
    const flexEntry = data.ranks?.find((r) => r.queueType === 'RANKED_FLEX_SR');

    this.soloStats.set(this.createBaseQueueStats(soloEntry));
    this.flexStats.set(this.createBaseQueueStats(flexEntry));
  }

  private createBaseQueueStats(entry?: RiotRank | null): QueueStats {
    const wins = entry?.wins ?? 0;
    const losses = entry?.losses ?? 0;
    const total = wins + losses;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const rank = entry ? `${entry.tier} ${entry.rank}` : 'Sem classificação';

    return { rank, winrate, wins, losses, recentSummary: `${wins}V ${losses}D`,
      matches: [],
      kpis: [
        { label: 'Total de Partidas', value: `${total}`, detail: 'Na temporada' },
        { label: 'Vitórias', value: `${wins}`, detail: `${winrate}% de aproveitamento` },
        { label: 'Derrotas', value: `${losses}`, detail: 'Temporada atual' },
        { label: 'Classificação', value: rank, detail: 'Ranqueada' },
      ],
      champions: [],
      positions: [],
    };
  }

  private loadMatchHistory(puuid: string): void {
    // Busca partidas de Solo/Duo (420)
    this.riot
      .getMatchesByPuuid(puuid, 420)
      .pipe(
        catchError(() => of([])),
        switchMap((matchIds) => {
          if (!matchIds || matchIds.length === 0) return of([]);
          const subset = matchIds.slice(0, 20);
          return forkJoin(
            subset.map((id) => this.riot.getDataPlayerMatch(id).pipe(catchError(() => of(null)))),
          );
        }),
      )
      .subscribe((matches) => {
        const validMatches = matches.filter((m): m is RiotMatchData => m !== null);
        if (validMatches.length > 0) {
          this.enrichQueueStats(puuid, 'solo', validMatches);
        }
      });

    // Busca partidas de Flex (440)
    this.riot.getMatchesByPuuid(puuid, 440)
      .pipe(
        catchError(() => of([])),
        switchMap((matchIds) => {
          if (!matchIds || matchIds.length === 0) return of([]);
          const subset = matchIds.slice(0, 20);
          return forkJoin(
            subset.map((id) => this.riot.getDataPlayerMatch(id).pipe(catchError(() => of(null)))),
          );
        }),
      )
      .subscribe((matches) => {
        const validMatches = matches.filter((m): m is RiotMatchData => m !== null);
        if (validMatches.length > 0) {
          this.enrichQueueStats(puuid, 'flex', validMatches);
        }
      });
  }

  private enrichQueueStats(puuid: string, queue: QueueId, matches: readonly RiotMatchData[]): void {
    const current = queue === 'solo' ? this.soloStats() : this.flexStats();
    if (!current) return;

    const version = this.profile()?.profileIconUrl?.split('/cdn/')[1]?.split('/')[0] ?? '14.24.1';
    const getIconUrl = (champName: string) => `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champName}.png`;

    const matchHistoryItems: MatchHistoryItem[] = [];
    const championMap = new Map<string, { games: number; wins: number; losses: number; kills: number; deaths: number; assists: number; }>();
    const positionMap = new Map<string, { games: number; wins: number }>();

    for (const match of matches) {
      const participant = match.info?.participants?.find((p) => p.puuid === puuid);
      if (!participant) continue;

      const isWin = !!participant.win;
      const champName = participant.championName || 'Desconhecido';

      matchHistoryItems.push({
        result: isWin ? 'V' : 'D',
        championName: champName,
        championIconUrl: getIconUrl(champName),
      });

      // Campeão
      const cData = championMap.get(champName) ?? { games: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 };
      cData.games++;
      if (isWin) cData.wins++;
      else cData.losses++;
      cData.kills += participant.kills ?? 0;
      cData.deaths += participant.deaths ?? 0;
      cData.assists += participant.assists ?? 0;
      championMap.set(champName, cData);

      // Posição
      const pos = participant.teamPosition;
      if (pos) {
        const pData = positionMap.get(pos) ?? { games: 0, wins: 0 };
        pData.games++;
        if (isWin) pData.wins++;
        positionMap.set(pos, pData);
      }
    }

    const champions: ChampionStats[] = Array.from(championMap.entries())
      .map(([name, data]) => {
        const winrate = data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0;
        const games = Math.max(1, data.games);
        const averageKills = this.kdaNumberFormatter.format(data.kills / games);
        const averageDeaths = this.kdaNumberFormatter.format(data.deaths / games);
        const averageAssists = this.kdaNumberFormatter.format(data.assists / games);
        return { 
          name, 
          championIconUrl: getIconUrl(name), 
          games: data.games,
          wins: data.wins,
          losses: data.losses,
          winrate,
          kda: `${averageKills} / ${averageDeaths} / ${averageAssists}`,
        };
      })
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    const positionLabels: Record<string, string> = {
      TOP: 'Topo',
      JUNGLE: 'Selva',
      MIDDLE: 'Meio',
      BOTTOM: 'Atirador',
      UTILITY: 'Suporte',
    };

    const positions = Array.from(positionMap.entries()).map(([pos, data]) => ({
      name: positionLabels[pos] ?? pos,
      winrate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
    }));

    const recentWins = matchHistoryItems.filter((m) => m.result === 'V').length;
    const recentLosses = matchHistoryItems.filter((m) => m.result === 'D').length;

    const updated: QueueStats = {
      ...current,
      recentSummary: `${recentWins}V ${recentLosses}D nas últimas ${matchHistoryItems.length}`,
      matches: matchHistoryItems,
      champions,
      positions,
    };

    if (queue === 'solo') {
      this.soloStats.set(updated);
    } else {
      this.flexStats.set(updated);
    }
  }
}
