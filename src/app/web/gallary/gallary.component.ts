import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';
import { GalleryItem } from '../../models/user-profile.model';
import { UserService } from '../../services/userService/user.service';
import { Location } from '@angular/common';
import { AnimatedSectionComponent } from "../../components/AnimatedSection";
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, AnimatedSectionComponent],
  templateUrl: './gallary.component.html',
})
export class GallaryComponent {
  gallery$: Observable<GalleryItem[]>;
  selectedImage: string | null = null;
  currentMonthItems$: Observable<GalleryItem[]>;
  now :Date = new Date();
  
  constructor(private userService: UserService,private location: Location) {
    this.gallery$ = this.userService.getGallery();

        this.currentMonthItems$ = this.gallery$.pipe(
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


openImageModal(url: string) {
    this.selectedImage = url;
    // Push fake history state so back button can be used to close modal
    this.location.go(this.location.path(), '', null); // push current path again
    window.addEventListener('popstate', this.onPopState);
  }

  closeModal() {
    this.selectedImage = null;
    window.removeEventListener('popstate', this.onPopState);
    this.location.back(); // remove the fake history state
  }

  onPopState = () => {
    // This gets triggered on back button
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
