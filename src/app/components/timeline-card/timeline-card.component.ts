import { Component, Input, ElementRef, AfterViewInit, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timeline-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-card.component.html',
})
export class TimelineCardComponent implements AfterViewInit {
  @Input() date!: string;
  @Input() title!: string;
  @Input() description!: string;
  @Input() image!: string;
  @Input() isLeft: boolean = true;

  isHovered = false;
  isVisible = false;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.isVisible = true;
          observer.unobserve(this.el.nativeElement); // observe only once
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(this.el.nativeElement);
  }
}
