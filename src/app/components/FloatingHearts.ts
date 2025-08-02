import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Heart {
  id: number;
  size: number;
  left: number;
  animationDuration: number;
  opacity: number;
  delay: number;
}

@Component({
  selector: 'app-floating-hearts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div
        *ngFor="let heart of hearts"
        class="absolute text-pink-400 animate-float-up"
        [ngStyle]="{
          fontSize: heart.size + 'px',
          left: heart.left + '%',
          opacity: heart.opacity,
          animationDuration: heart.animationDuration + 's',
          animationDelay: heart.delay + 's'
        }"
      >
        ❤️
      </div>
    </div>
  `,
  styles: [`
@keyframes float-up {
  0% {
    transform: translateY(130vh);
    opacity: 0.3;
  }
  10% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-150vh); 
    opacity: 0.3;
  }
}


    .animate-float-up {
      animation-name: float-up;
      animation-timing-function: ease-in;
      animation-iteration-count: infinite;
      position: absolute;
    }
  `]
})
export class FloatingHeartsComponent implements OnInit {
  hearts: Heart[] = [];
  count = 17;

  ngOnInit() {
    const newHearts: Heart[] = [];
    for (let i = 0; i < this.count; i++) {
      newHearts.push({
        id: i,
        size: Math.random() * 20 + 10,
        left: Math.random() * 100,
        animationDuration: Math.random() * 10 + 10,
        opacity: Math.random() * 0.7 + 0.3,
        delay: Math.random() * 5
      });
    }
    this.hearts = newHearts;
  }
}
