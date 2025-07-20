import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '../../components/loading/loading.component';
import { UserService } from '../../services/userService/user.service';
@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
 user: any;
  timelineItems: any[] = [];
  galleryItems: any[] = [];
  playlists: any[] = [];
  noOfDays :any='';
  stats: any[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    
    try{
      this.userService.userProfile$.subscribe(user => {
      this.user = user;
      this.updateStats();
    });

    this.userService.getTimeline().subscribe(items => {
      this.timelineItems = items;
      this.updateStats();
    });

    this.userService.getGallery().subscribe(items => {
      this.galleryItems = items;
      this.updateStats();
    });

    this.userService.getPlaylists().subscribe(items => {
      this.playlists = items;
      this.updateStats();
    });

      this.userService.getNoOfDays().subscribe(items => {
      this.noOfDays = items;
      this.updateStats();
    });

    }catch(err){
      console.log('error in admin dashboard',err)
    }    
  }

 

  updateStats(): void {
    this.stats = [
      {
        title: 'Beautiful Memories',
        count: this.timelineItems.length,
        icon: '💖',
        color: 'from-pink-500 to-rose-500'
      },
      {
        title: 'Precious Photos',
        count: this.galleryItems.length,
        icon: '📸',
        color: 'from-purple-500 to-pink-500'
      },
      {
        title: 'Love Playlists',
        count: this.playlists.length,
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
