import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Riot } from '../../services/riot';
import { SummonerCache } from '../../services/cache/summoner-cache';
import { Cards } from './cards/cards';

@Component({
  selector: 'app-summoner',
  imports: [Cards],
  templateUrl: './summoner.html',
})
export class Summoner {
  private readonly riot = inject(Riot);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cache = inject(SummonerCache);

  readonly profile = this.cache.profile;
  readonly searchedGameName = this.cache.gameName;
  readonly searchedTagLine = this.cache.tagLine;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  searchPlayer(gameNameValue: string, tagLineValue: string): void {
    if (this.loading()) return;

    const gameName = gameNameValue.trim();
    const tagLine = tagLineValue.trim().replace(/^#/, '').trim();

    if (!gameName || !tagLine) {
      this.profile.set(null);
      this.error.set('Informe o nome do jogador e a tagline.');
      return;
    }

    this.searchedGameName.set(gameName);
    this.searchedTagLine.set(tagLine);
    this.loading.set(true);
    this.profile.set(null);
    this.error.set(null);

    this.riot
      .getPlayerProfile(gameName, tagLine)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (profile) => this.profile.set(profile),
        error: (error: unknown) => {
          console.error('[Summoner] Erro ao buscar perfil pelo Riot ID:', error);
          this.error.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Não foi possível carregar o perfil.';
    }

    switch (error.status) {
      case 401:
        return 'Acesso não autorizado. Verifique sua chave da Riot.';
      case 403:
        return 'A chave da Riot (RGAPI) expirou ou é inválida. Renove-a no developer.riotgames.com.';
      case 404:
        return 'Jogador não encontrado. Confira o nome e a tagline.';
      case 429:
        return 'Limite de requisições à Riot atingido. Aguarde alguns segundos.';
      case 503:
        return 'Serviço indisponível ou proxy não configurado.';
      default:
        return error.status === 0 || error.message.includes('Http failure')
          ? 'Erro de conexão com o proxy. Reinicie o npm start no terminal.'
          : `Erro ${error.status}: ${error.status || error.message}`;
    }
  }
}
