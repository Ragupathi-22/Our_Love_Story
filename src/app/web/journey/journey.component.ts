import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimelineItem } from '../../models/user-profile.model';
import { AnimatedSectionComponent } from '../../components/AnimatedSection';
import { UserService } from '../../services/userService/user.service';
import { TimelineCardComponent } from '../../components/timeline-card/timeline-card.component';
declare const confetti: any;

@Component({
  selector: 'app-journey',
  standalone: true,
  imports: [CommonModule, TimelineCardComponent, AnimatedSectionComponent],
  templateUrl: './journey.component.html'
})
export class JourneyComponent {
  timeline$: Observable<TimelineItem[]>;
  currentMonthItems$: Observable<TimelineItem[]>;
     now :Date = new Date();
  constructor(private userService: UserService) {
    this.timeline$ = this.userService.getTimeline();

    this.currentMonthItems$ = this.timeline$.pipe(
      map(items =>
        items.filter(item => {
        console.log(items) ;

          const date = new Date(item.date);
          const now = new Date();
          return (
            date.getMonth() === now.getMonth()
          );
        })
      )
    );
  }

  showCelebrate() {
    // Main heart confetti from lower point
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.8 },
      shapes: ['text'],
      scalar: 2,
      gravity: 0.3,
      ticks: 500,
      decay: 0.9,
      colors: ['#ff69b4', '#ffb6c1', '#ffc0cb'],
      shapeOptions: {
        text: ['💖', '❤️'],
      },
    });

    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.85 },
        shapes: ['circle'],
        scalar: 1.2,
        gravity: 0.3,
        ticks: 400,
        decay: 0.95,
        colors: ['#ff4d6d', '#ffe0e9', '#ff90b3'],
      });
    }, 1000);
  }
}
