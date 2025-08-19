import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryItem } from '../../models/user-profile.model';
import { UserService } from '../../services/userService/user.service';


@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallary.component.html',
})
export class GallaryComponent {
  galleryItems: GalleryItem[] = [];
  selectedImage: string | null = null;
  isLoading = false;
  allLoaded = false;
  currentMonthItems: GalleryItem[] = [];
  now: Date = new Date();

  constructor(private userService: UserService) {
    this.resetGallery();
    this.loadCurrentMonthItems();
  }

  async loadNextPage() {
    if (this.isLoading || this.allLoaded) return;
    this.isLoading = true;

    const newItems = await this.userService.getGalleryPage(20);

    if (newItems.length === 0) {
      this.allLoaded = true;
    } else {
      this.galleryItems = [...this.galleryItems, ...newItems];
    }

    this.isLoading = false;
  }

  resetGallery() {
    this.userService.resetGalleryPagination();
    this.galleryItems = [];
    this.allLoaded = false;
    this.loadNextPage();
  }

  async loadCurrentMonthItems() {
    this.currentMonthItems = await this.userService.getCurrentMonthGallery();
  }

  openImageModal(url: string) {
    this.selectedImage = url;
    window.history.pushState({}, '', window.location.href);
    window.addEventListener('popstate', this.onPopState);
  }

  closeModal() {
    this.selectedImage = null;
    window.removeEventListener('popstate', this.onPopState);
    history.back();
  }

  onPopState = () => {
    if (this.selectedImage) {
      this.selectedImage = null;
      window.removeEventListener('popstate', this.onPopState);
    }
  };

  downloadImage(url: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'downloaded-image';
    a.click();
  }
}
