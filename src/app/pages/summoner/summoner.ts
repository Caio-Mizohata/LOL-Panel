import { HttpErrorResponse } from '@angular/common/http';
import { afterRenderEffect, Component, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { finalize } from 'rxjs';
import { SummonerCardState } from '../../models/riot.models';
import { Riot } from '../../services/riot';
import { Cards } from './cards/cards';
import { FRIENDS_PUUIDS } from './summoner.config';


@Component({
  selector: 'app-summoner',
  imports: [Cards, NgIcon],
  providers: [provideIcons({ lucideChevronLeft, lucideChevronRight })],
  templateUrl: './summoner.html',
  styleUrl: './summoner.css',
})
export class Summoner implements OnInit {
  private readonly riot = inject(Riot);
  private readonly destroyRef = inject(DestroyRef);

  readonly cards = signal<SummonerCardState[]>([]);
  readonly carouselRef = viewChild<ElementRef<HTMLDivElement>>('carousel');
  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(false);
  readonly activeIndex = signal(0);
  readonly scrollPositions = signal<number[]>([]);

  constructor() {
    afterRenderEffect({
      read: (onCleanup) => {
        this.cards();
        this.updateScrollState();

        const el = this.carouselRef()?.nativeElement;
        if (el && typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(() => this.updateScrollState());
          observer.observe(el);
          onCleanup(() => observer.disconnect());
        }
      },
    });
  }

  ngOnInit(): void {
    this.loadFriendsProfiles(FRIENDS_PUUIDS);
  }

  loadFriendsProfiles(puuids: readonly string[]): void {
    const initialCards: SummonerCardState[] = puuids.map((puuid) => ({
      puuid,
      profile: null,
      loading: true,
      error: null,
    }));

    this.cards.set(initialCards);

    for (const item of initialCards) {
      this.fetchProfile(item.puuid);
    }
  }

  updateScrollState(): void {
    const el = this.carouselRef()?.nativeElement;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const carouselLeft = el.getBoundingClientRect().left + el.clientLeft;
    const positions: number[] = [];

    for (const child of Array.from(el.children)) {
      const card = child as HTMLElement;
      const cardLeft = card.getBoundingClientRect().left - carouselLeft + scrollLeft;
      const centeredPosition = cardLeft + (card.offsetWidth - clientWidth) / 2;
      const position = Math.min(maxScroll, Math.max(0, centeredPosition));

      // Cards que compartilham o limite inicial ou final usam o mesmo indicador.
      if (positions.length === 0 || position - positions[positions.length - 1] > 1) {
        positions.push(position);
      }
    }

    this.scrollPositions.set(positions);
    this.canScrollPrev.set(scrollLeft > 1);
    this.canScrollNext.set(scrollLeft < maxScroll - 1);

    const index = positions.reduce(
      (closest, position, current) => Math.abs(
        position - scrollLeft) < Math.abs(positions[closest] - scrollLeft) ? current : closest, 0,
      );
    this.activeIndex.set(index);
  }

  scrollPrev(): void {
    this.scrollToIndex(this.activeIndex() - 1);
  }

  scrollNext(): void {
    this.scrollToIndex(this.activeIndex() + 1);
  }

  scrollToIndex(index: number): void {
    const el = this.carouselRef()?.nativeElement;
    const position = this.scrollPositions()[index];
    if (!el || position === undefined) return;

    el.scrollTo({ left: position, behavior: 'smooth' });
  }

  private fetchProfile(puuid: string): void {
    this.riot
      .getPlayerProfileByPuuid(puuid)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cards.update((items) => items.map((c) => (c.puuid === puuid ? { ...c, loading: false } : c)),
        );
        }),
      )
      .subscribe({
        next: (profile) => {
          this.cards.update((items) => items.map((c) => (c.puuid === puuid ? { ...c, profile, error: null } : c)),
        );
        },
        error: (error: unknown) => {
          console.error(`[Summoner] Erro ao carregar perfil para o PUUID ${puuid}:`, error);

          let errorMsg = 'Não foi possível carregar o perfil.';

          if (error instanceof HttpErrorResponse) {
            switch (error.status) {
              case 401:
                errorMsg = 'Acesso não autorizado. Verifique sua chave da Riot.';
                break;
              case 403:
                errorMsg =
                  'A chave da Riot (RGAPI) expirou ou é inválida. Renove no developer.riotgames.com.';
                break;
              case 404:
                errorMsg = 'Jogador não encontrado na região BR1.';
                break;
              case 429:
                errorMsg = 'Limite de requisições à Riot atingido. Aguarde alguns segundos.';
                break;
              case 503:
                errorMsg = 'Serviço indisponível ou proxy não configurado.';
                break;
              default:
                if (error.status === 0 || error.message.includes('Http failure')) {
                  errorMsg = 'Erro de conexão com o proxy. Reinicie o npm start no terminal.';
                } else {
                  errorMsg = `Erro ${error.status}: ${error.statusText || error.message}`;
                }
                break;
            }
          }

          this.cards.update((items) =>
            items.map((c) => (c.puuid === puuid ? { ...c, error: errorMsg } : c)),
          );
        },
      });
  }
}
