import { Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { PlayerSearchParams } from '../../models/search.models';

@Component({
  imports: [HlmButton],
  selector: 'app-search',
  styleUrl: './search.css',
  templateUrl: './search.html',
})
export class Search {
  readonly loading = input(false);
  readonly searchRequested = output<PlayerSearchParams>();
}
