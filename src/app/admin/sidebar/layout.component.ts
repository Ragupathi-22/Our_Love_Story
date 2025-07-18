import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from "./sidebar.component";
import { LoadingComponent } from "../../components/loading/loading.component";
import { FooterComponent } from "../../components/footer.component";

@Component({
    selector: 'app-nav-item',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent, LoadingComponent, FooterComponent],
    template: `
   <div class="flex h-screen">
    <app-loading></app-loading>
    <app-sidebar></app-sidebar> <!-- Left Sidebar -->
    <div class="flex-1 p-0 md:p-5 overflow-y-auto">
    <router-outlet></router-outlet> <!-- Content will show here -->
    <app-footer></app-footer>
  </div>
</div>
  `
})
export class LayoutComponent {

}
