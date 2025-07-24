import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/userService/user.service';
import { GalleryItem } from '../../models/user-profile.model';
import { GalleryService } from './gallary.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gallery.component.html'
})
export class GalleryComponent implements OnInit {
  form: FormGroup;
  today:string='';
  photos: GalleryItem[] = [];
  editingId: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string = '';
  previousPhotoUrl: string = '';
  deletePreviousPhoto: string = '';
  isLoading: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private galleryService: GalleryService,
    private toastr: ToastrService,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
       date: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.today = new Date().toISOString().split('T')[0];

    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    try {
      this.photos = await this.galleryService.getGallery(uid);
    } catch (error) {
      console.error('Failed to load gallery items:', error);
    }
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

      const updatedGallery = await this.galleryService.addOrUpdateGallery(
        uid,
        formData,
        photoUrl,
        this.editingId,
        this.deletePreviousPhoto
      );

      this.photos = updatedGallery ?? this.photos;
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

  async handleDelete(id: string) {
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.isLoading = true;
    this.toastr.info('Deleting photo...');

    try {
      const updatedGallery = await this.galleryService.deleteGalleryItem(uid, id);
      this.photos = updatedGallery ?? this.photos;
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