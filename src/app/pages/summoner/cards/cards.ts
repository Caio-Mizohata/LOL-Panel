import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { RiotPlayerProfile, RiotRank } from '../../../models/riot.models';

@Component({
  selector: 'app-cards',
  imports: [HlmCardImports, NgOptimizedImage],
  templateUrl: './cards.html',
  styleUrl: './cards.css',
})
export class Cards {
  readonly profile = input<RiotPlayerProfile | null>(null);
  readonly priority = input(false);

  private readonly numberFormatter = new Intl.NumberFormat('pt-BR');

  private readonly rankLabels: Readonly<Record<string, string>> = {
    IRON: 'Ferro',
    BRONZE: 'Bronze',
    SILVER: 'Prata',
    GOLD: 'Ouro',
    PLATINUM: 'Platina',
    EMERALD: 'Esmeralda',
    DIAMOND: 'Diamante',
    MASTER: 'Mestre',
    GRANDMASTER: 'Grão-Mestre',
    CHALLENGER: 'Desafiante',
  };

  readonly topMasteries = computed(() =>
    [...(this.profile()?.masteries ?? [])]
      .sort((a, b) => b.championPoints - a.championPoints)
      .slice(0, 3),
  );

  readonly rankedQueues = computed(() => {
    const ranks = this.profile()?.ranks;
    return [
      { queueType: 'RANKED_SOLO_5x5', label: 'Solo/Duo' },
      { queueType: 'RANKED_FLEX_SR', label: 'Flex' },
    ].map((queue) => {
      const entry = ranks?.find((rank: RiotRank) => rank.queueType === queue.queueType);
      const label = entry && this.rankLabels[entry.tier];
      return {
        ...queue,
        entry,
        emblemUrl: entry && label ? `ranks/${entry.tier.toLowerCase()}.png` : null,
        emblemAlt: label ? `Elo ${label}` : '',
        unavailable: ranks == null,
      };
    });
  });

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }
}
