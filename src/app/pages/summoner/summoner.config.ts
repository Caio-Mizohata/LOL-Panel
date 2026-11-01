import { PLAYER_PUUIDS } from './summoner.puuids.local';

// Monte a lista usada pelo carrossel a partir da configuração local.
const puuids = new Set<string>();

for (const value of PLAYER_PUUIDS) {
  const puuid = value.trim();
  if (puuid) puuids.add(puuid);
}

export const FRIENDS_PUUIDS: readonly string[] = [...puuids];
