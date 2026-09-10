import { Component } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';


@Component({
  imports: [HlmCardImports],
  selector: 'app-content',
  styleUrl: './content.css',
  templateUrl: './content.html',
})
export class Content {}
