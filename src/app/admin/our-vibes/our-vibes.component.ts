// app/our-vibes/our-vibes.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PlaylistItem } from '../../models/user-profile.model';
import { VibeService } from './vibe.service';
import { UserService } from '../../services/userService/user.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-our-vibes',
  templateUrl: './our-vibes.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class OurVibesComponent implements OnInit {
  form!: FormGroup;
  playlists: PlaylistItem[] = [];
  editingId: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private vibeService: VibeService,
    private userService: UserService,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      playlistUrl: ['', [Validators.required]],
      playlistName: ['', [Validators.required]]
    });

 this.userService.getPlaylists().subscribe(playlists => {
  this.playlists = playlists || [];
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

  handleSubmit(): void {
    if (this.form.invalid) {
      this.toastr.error('Please fill the name and playlist url;');
      return;
    };

    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.isLoading = true;
    this.toastr.info("Saving playlist...");

    const playlist: PlaylistItem = {
      id: this.editingId || '',
      playlistUrl: this.form.value.playlistUrl,
      playlistName: this.form.value.playlistName
    };

    this.vibeService.savePlaylist(uid, playlist, this.editingId).then((updated) => {
      this.playlists = updated;
      this.resetForm();
      this.toastr.success(this.editingId ? 'Playlist updated' : 'Playlist added');
    }).catch(() => {
      this.toastr.error('Something went wrong');
    }).finally(() => {
      this.isLoading = false;
    });
  }

  edit(item: PlaylistItem): void {
    this.editingId = item.id;
    this.form.patchValue({
      playlistUrl: item.playlistUrl,
      playlistName: item.playlistName
    });
  }

  delete(id: string): void {
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.vibeService.deletePlaylist(uid, id).then((updated) => {
      this.playlists = updated;
      this.toastr.success('Playlist deleted');
    }).catch(() => {
      this.toastr.error('Error deleting playlist');
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset();
  }
}
