import { Component, OnDestroy, OnInit } from '@angular/core';
import { AnimatedSectionComponent } from '../../components/AnimatedSection';
import { FloatingHeartsComponent } from '../../components/FloatingHearts';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserService } from '../../services/userService/user.service';



@Component({
  selector: 'app-home',
  imports: [AnimatedSectionComponent, FloatingHeartsComponent, RouterModule, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  loveStartDate = new Date();
  counter = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private intervalId: any;

  constructor(private userService: UserService) {
    this.userService.userProfile$.subscribe((profile) => {
      this.loveStartDate = profile?.loveStartDate ? new Date(profile.loveStartDate) : this.loveStartDate;
    })
  }

  ngOnInit() {
    this.updateCounter();
    this.intervalId = setInterval(() => this.updateCounter(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  updateCounter() {
    const now = new Date().getTime();
    const start = this.loveStartDate.getTime();
    const diff = now - start;

    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    this.counter = { days, hours, minutes, seconds };
  }
}
