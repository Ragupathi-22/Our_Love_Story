import { Component, Input, OnInit, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [ngClass]="animationClass"
      [class.opacity-0]="!isVisible"
      [ngStyle]="{ transitionDelay: delay + 'ms' }"
      class="transition-all duration-700"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      opacity: 1;
      transform: none;
    }

    .animate-slide-up {
      transform: translateY(0);
      opacity: 1;
    }

    .animate-slide-right {
      transform: translateX(0);
      opacity: 1;
    }

    .animate-slide-left {
      transform: translateX(0);
      opacity: 1;
    }

    .opacity-0 {
      opacity: 0 !important;
    }

    .transition-all {
      transition: all 0.7s ease-in-out;
    }

    .duration-700 {
      transition-duration: 0.7s;
    }

    /* Initial states */
    :host-context(.fade-in) { opacity: 0; }
    :host-context(.slide-up) { transform: translateY(30px); opacity: 0; }
    :host-context(.slide-right) { transform: translateX(-30px); opacity: 0; }
    :host-context(.slide-left) { transform: translateX(30px); opacity: 0; }
  `]
})
export class AnimatedSectionComponent implements OnInit, AfterViewInit {
  @Input() animation: 'fade-in' | 'slide-up' | 'slide-right' | 'slide-left' = 'fade-in';
  @Input() delay: number = 0;
  @Input() className: string = '';

  isVisible = false;
  animationClass = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    // Set initial transform based on animation type
    const native = this.el.nativeElement.querySelector('div');
    switch (this.animation) {
      case 'slide-up':
        this.renderer.setStyle(native, 'transform', 'translateY(30px)');
        break;
      case 'slide-left':
        this.renderer.setStyle(native, 'transform', 'translateX(30px)');
        break;
      case 'slide-right':
        this.renderer.setStyle(native, 'transform', 'translateX(-30px)');
        break;
    }
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.isVisible = true;
        this.animationClass = this.getAnimationClass();
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });

    observer.observe(this.el.nativeElement.querySelector('div'));
  }

  getAnimationClass(): string {
    switch (this.animation) {
      case 'slide-up':
        return 'animate-slide-up';
      case 'slide-left':
        return 'animate-slide-left';
      case 'slide-right':
        return 'animate-slide-right';
      case 'fade-in':
      default:
        return 'animate-fade-in';
    }
  }
}
