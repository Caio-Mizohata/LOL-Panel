import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Summoner } from './summoner';

describe('Summoner', () => {
  let component: Summoner;
  let fixture: ComponentFixture<Summoner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Summoner],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Summoner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows only reachable positions and selects the last indicator at the end', async () => {
    component.cards.set(
      Array.from({ length: 6 }, (_, index) => ({
        puuid: `test-player-${index}`,
        profile: null,
        loading: true,
        error: null,
      })),
    );
    await fixture.whenStable();

    const carousel = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
    Object.defineProperties(carousel, {
      clientWidth: { configurable: true, value: 340 },
      scrollWidth: { configurable: true, value: 700 },
    });
    vi.spyOn(carousel, 'getBoundingClientRect').mockReturnValue({ left: 0 } as DOMRect);
    Array.from(carousel.children).forEach((child, index) => {
      Object.defineProperty(child, 'offsetWidth', { value: 100 });
      vi.spyOn(child, 'getBoundingClientRect').mockImplementation(
        () => ({ left: index * 120 - carousel.scrollLeft }) as DOMRect,
      );
    });

    component.updateScrollState();
    expect(component.scrollPositions()).toEqual([0, 120, 240, 360]);

    carousel.scrollLeft = 360;
    component.updateScrollState();
    await fixture.whenStable();

    const indicators = fixture.nativeElement.querySelectorAll(
      '[aria-label="Posições do carrossel"] button',
    );
    expect(indicators.length).toBe(4);
    expect(indicators[3].getAttribute('aria-current')).toBe('true');
    expect(component.canScrollNext()).toBe(false);

    Object.defineProperty(carousel, 'clientWidth', { configurable: true, value: 100 });
    component.updateScrollState();
    expect(component.scrollPositions()).toEqual([0, 120, 240, 360, 480, 600]);
  });
});
