export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
}

export interface DataDragonChampion {
  key: string;
  name: string;
  image: { full: string };
}

export interface DataDragonCatalog {
  data: Record<string, DataDragonChampion>;
}

export interface RiotChampionMastery extends ChampionMastery {
  championName: string | null;
  championIconUrl: string | null;
}

export interface RiotRank {
  queueType: string;
  tier: string;
  rank: string;
  wins: number;
  losses: number;
}

export interface RiotPlayerProfile {
  account: RiotAccount;
  summoner: RiotSummoner;
  masteries: RiotChampionMastery[];
  profileIconUrl: string | null;
  ranks: RiotRank[] | null;
}

export type RiotMatchIds = string[];

export interface RiotMatchData {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    queueId: number;
    participants: {
      puuid: string;
      win: boolean;
      championId: number;
      championName: string;
      teamPosition: string;
      kills?: number;
      deaths?: number;
      assists?: number;
      totalDamageDealtToChampions?: number;
      goldEarned?: number;
      visionScore?: number;
      champLevel?: number;
      timePlayed?: number;
    }[];
  };
}

export type QueueId = 'solo' | 'flex';
export type MatchResult = 'V' | 'D';

export interface MatchHistoryItem {
  result: MatchResult;
  championName: string;
  championIconUrl: string;
}

export interface ChampionStats {
  name: string;
  championIconUrl?: string | null;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  kda: string;
}

export interface QueueStats {
  rank: string;
  winrate: number;
  wins: number;
  losses: number;
  recentSummary: string;
  matches: readonly MatchHistoryItem[];
  kpis: readonly { label: string; value: string; detail: string }[];
  champions: readonly ChampionStats[];
  positions: readonly { name: string; winrate: number }[];
}
