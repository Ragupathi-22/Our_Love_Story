import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserService } from '../../services/userService/user.service';
import { PlaylistItem } from '../../models/user-profile.model';
import { LoadingService } from '../../components/loading/loading.service';
import { AnimatedSectionComponent } from '../../components/AnimatedSection';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-ourvibes',
  standalone: true,
  imports: [CommonModule, AnimatedSectionComponent],
  templateUrl: './our-vibes.component.html'
})
export class OurVibesComponent implements OnInit {
  safePlaylistUrls: { item: PlaylistItem; safeUrl: SafeResourceUrl }[] = [];

  constructor(
    private userService: UserService,
    private sanitizer: DomSanitizer,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingService.show();

    this.userService.getPlaylists().pipe(
      map(playlists => playlists.map(item => ({
        item,
        safeUrl: this.getSafeUrl(item.playlistUrl)
      })))
    ).subscribe(result => {
      this.safePlaylistUrls = result;

      // Delay hiding to ensure DOM is painted
      setTimeout(() => {
        this.loadingService.hide();
      }, 300);
    });
  }

  getSafeUrl(url: string): SafeResourceUrl {
    try {
      const parsed = new URL(url);
      const listId = parsed.searchParams.get('list');
      if (listId) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0&modestbranding=1&showinfo=0`
        );
      }
    } catch (e) {
      console.warn('Invalid playlist URL:', url);
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
