// nav-item.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <li>
      <a
  (click)="navigate()"
  class="flex items-center space-x-2 p-2 rounded hover:bg-pink-100 cursor-pointer"
  [ngClass]="{ 'bg-pink-100 font-semibold': currentPath === item.path }">
  <span>{{ item.icon }}</span>
  <span>{{ item.label }}</span>
</a>

    </li>
  `
})
export class NavItemComponent {
  @Input() item: any;
  @Input() currentPath: string = '';
  @Output() navClicked = new EventEmitter<void>();

  constructor(private router: Router) { }

  navigate() {
    this.router.navigate([this.item.path]).then(() => {
      this.navClicked.emit();
    });
  }
}
