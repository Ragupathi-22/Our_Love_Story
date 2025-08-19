import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class JourneyComponent implements OnInit {
  timelineItems: TimelineItem[] = [];
  currentMonthItems: TimelineItem[] = [];
  isLoading = false;
  allLoaded = false;
  now: Date = new Date();

  constructor(private userService: UserService) {

  }
  ngOnInit() {
    this.refreshTimeline();
    this.loadCurrentMonthItems();
    this.loadNextPage();
  }

  async loadNextPage() {
    if (this.isLoading || this.allLoaded) return;

    this.isLoading = true;
    const newItems = await this.userService.getTimelinePage(20);

    if (newItems.length === 0) {
      this.allLoaded = true; // No more data to load
    } else {
      this.timelineItems = [...this.timelineItems, ...newItems];
    }

    this.isLoading = false;
  }

  async loadCurrentMonthItems() {
    this.currentMonthItems = await this.userService.getCurrentMonthTimeline();
  }

  refreshTimeline() {
    this.userService.resetTimelinePagination();
    this.timelineItems = [];
    this.allLoaded = false;
    this.loadNextPage();
  }

  showCelebrate() {
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
