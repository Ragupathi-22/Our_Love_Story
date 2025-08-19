import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/userService/user.service';
import { CountService } from '../../services/userService/count.service';
import { TimelineItem } from '../../models/user-profile.model';
import { LoadingService } from '../../components/loading/loading.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  user: any;
  timelineCount: number = 0;
  galleryCount: number = 0;
  playlistsCount: number = 0;
  timelineItems: TimelineItem[] = [];
  playlists: any[] = [];
  noOfDays: string = '0';
  stats: any[] = [];

  constructor(private userService: UserService, private countService: CountService, private loadingService :LoadingService) { }

  async ngOnInit(): Promise<void> {
    this.userService.userProfile$.subscribe(user => {
      this.user = user;
      this.updateStats();
    });
    this.userService.resetTimelinePagination();
    this.timelineItems = await this.userService.getTimelinePage(3);
    this.userService.getPlaylists().subscribe((res) => {
      this.playlists = res || [];
    })

    await this.loadCounts();
  }

async loadCounts(): Promise<void> {
  // Show loading at the start of combined fetch
  this.loadingService.show();

  try {
    const [
      timelineCount,
      galleryCount,
      playlistsCount,
      noOfDays
    ] = await Promise.all([
      this.countService.getTimelineCount(),
      this.countService.getGalleryCount(),
      this.countService.getPlaylistsCount(),
      new Promise<string>(resolve => {
        this.userService.getNoOfDays().subscribe(days => resolve(days));
      })
    ]);

    // Assign values after all loaded
    this.timelineCount = timelineCount;
    this.galleryCount = galleryCount;
    this.playlistsCount = playlistsCount;
    this.noOfDays = noOfDays;

    this.updateStats();
  } catch (error) {
    console.error('Error loading counts:', error);
  } finally {
    // Hide loading once all complete or error thrown
    this.loadingService.hide();
  }
}


  updateStats(): void {
    this.stats = [
      {
        title: 'Beautiful Memories',
        count: this.timelineCount,
        icon: '💖',
        color: 'from-pink-500 to-rose-500'
      },
      {
        title: 'Precious Photos',
        count: this.galleryCount,
        icon: '📸',
        color: 'from-purple-500 to-pink-500'
      },
      {
        title: 'Love Playlists',
        count: this.playlistsCount,
        icon: '🎵',
        color: 'from-blue-500 to-purple-500'
      },
      {
        title: 'Since Our First Hello',
        count: this.noOfDays,
        icon: '💕',
        color: 'from-red-500 to-pink-500'
      },
      {
        title: 'Milestones',
        count: '∞',
        icon: '🌟',
        color: 'from-yellow-500 to-orange-500'
      }
    ];
  }
}
