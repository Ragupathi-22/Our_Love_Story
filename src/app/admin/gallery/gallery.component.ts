import {
  Component,
  OnInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/userService/user.service';
import { GalleryItem } from '../../models/user-profile.model';
import { GalleryService } from './gallary.service';
import { LucideAngularModule, Edit, Trash } from 'lucide-angular';
import { ConfirmDialogService } from '../../services/confirmationService/confirm_dialog.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './gallery.component.html'
})
export class GalleryComponent implements OnInit {
  editIco = Edit;
  deleteIco = Trash;
  form: FormGroup;
  today: string = '';
  photos: GalleryItem[] = [];
  editingId: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string = '';
  previousPhotoUrl: string = '';
  deletePreviousPhoto: string = '';
  isLoading: boolean = false;
  allLoaded: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private galleryService: GalleryService,
    private toastr: ToastrService,
    private confirmService: ConfirmDialogService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      date: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.today = new Date().toISOString().split('T')[0];
    this.resetPagination();
  }

  async loadNextPage() {
    if (this.isLoading || this.allLoaded) return;
    this.isLoading = true;

    const uid = this.userService.getCurrentUserId();
    if (!uid) {
      this.isLoading = false;
      return;
    }

    const newPhotos = await this.galleryService.getGalleryPage(uid, 20);
    if (newPhotos.length === 0) {
      this.allLoaded = true;
    } else {
      this.photos = [...this.photos, ...newPhotos];
    }

    this.isLoading = false;
  }

  resetPagination() {
    this.galleryService.resetGalleryPagination();
    this.photos = [];
    this.allLoaded = false;
    this.loadNextPage();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.previewUrl = URL.createObjectURL(this.selectedFile);
      this.previousPhotoUrl = '';
    }
  }

  async handleSubmit() {
    if (this.form.invalid || (!this.previousPhotoUrl && !this.selectedFile)) {
      this.toastr.error('Please complete all fields and upload a photo.', 'Validation Error');
      return;
    }

    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.isLoading = true;
    const isEditing = !!this.editingId;
    this.toastr.info(isEditing ? 'Updating photo...' : 'Uploading photo...');

    const formData = this.form.value;
    let photoUrl = this.previousPhotoUrl;

    try {
      if (this.selectedFile) {
        photoUrl = await this.galleryService.uploadImage(uid, this.selectedFile);
      }

      const updatedItem = await this.galleryService.addOrUpdateGallery(
        uid,
        formData,
        photoUrl,
        this.editingId,
        this.deletePreviousPhoto
      );

      if (updatedItem) {
        if (isEditing) {
          const index = this.photos.findIndex(p => p.id === this.editingId);
          if (index !== -1) this.photos[index] = updatedItem;
        } else {
          this.photos.unshift(updatedItem);
        }
      } else {
        this.resetPagination();
      }

      this.toastr.success(isEditing ? 'Photo updated!' : 'Photo added!', 'Success');
      this.resetForm();
    } catch (error) {
      console.error('Photo save failed:', error);
      this.toastr.error('Something went wrong. Please try again.', 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  handleEdit(item: GalleryItem) {
    this.form.patchValue({
      title: item.title,
      date: item.date
    });
    this.editingId = item.id;
    this.previousPhotoUrl = item.photoUrl || '';
    this.deletePreviousPhoto = item.photoUrl || '';
    this.selectedFile = null;
    this.previewUrl = item.photoUrl;
  }

  async handleDelete(item: any) {
    const confirmed = await this.confirmService.show(
      'Delete Picture',
      `Are you sure you want to let go of this picture? 💔\n${item.title}`,
      'Yes, Delete it',
      'Keep it'
    );

    if (!confirmed) return;

    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.isLoading = true;
    this.toastr.info('Deleting photo...');

    try {
      const success = await this.galleryService.deleteGalleryItem(uid, item.id);
      if (success) {
        this.photos = this.photos.filter(p => p.id !== item.id);
      } else {
        this.toastr.error('Failed to delete the photo.', 'Error');
      }
      this.toastr.success('Photo deleted successfully!', 'Deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      this.toastr.error('Something went wrong during deletion.', 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  cancelEdit() {
    this.resetForm();
  }

  removePhoto() {
    this.previousPhotoUrl = '';
    this.selectedFile = null;
    this.previewUrl = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  resetForm() {
    this.form.reset();
    this.selectedFile = null;
    this.editingId = null;
    this.previousPhotoUrl = '';
    this.previewUrl = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
