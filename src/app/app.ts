import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './pages/main/navbar/navbar';
import { Footer } from './pages/main/footer/footer';

@Component({
  imports: [RouterOutlet, Navbar, Footer],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
