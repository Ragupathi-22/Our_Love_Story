import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../components/footer.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { LoadingComponent } from "../../components/loading/loading.component";


@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, LoadingComponent],
  template: `
    <app-loading></app-loading>
    <app-navbar></app-navbar>
    <main class="flex-grow">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `
})
export class ShellComponent {}
