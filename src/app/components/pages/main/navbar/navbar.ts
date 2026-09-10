import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCircle, lucideInfo } from '@ng-icons/lucide';
import { HlmNavigationMenuImports } from '@spartan-ng/helm/navigation-menu';

@Component({
	imports: [...HlmNavigationMenuImports, RouterLink],
	providers: [provideIcons({ lucideCircle, lucideCheck, lucideInfo })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-navbar',
	styleUrl: './navbar.css',
	templateUrl: './navbar.html',
})
export class Navbar {
	protected readonly _components = [
		{
			title: 'Perfil',
			description: 'Estatísticas do perfil do jogador',
			href: '#',
		},
		{
			title: 'Partidas jogadas',
			description: 'Estatísticas do histórico de partidas jogadas',
			href: '#',
		},
	];
}
