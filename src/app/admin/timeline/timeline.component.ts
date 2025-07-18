import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/userService/user.service';
import { TimelineItem } from '../../models/user-profile.model';
import { TimelineService } from '../../services/timelineService/timelineService ';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './timeline.component.html'
})
export class TimelineComponent implements OnInit {
  form: FormGroup;
  today :string='';
  timelineItems: TimelineItem[] = [];
  editingId: string | null = null;
  selectedFile: File | null = null;
  previousPhotoUrl: string = '';
  deletePreviousPhoto:string =''; 
  isLoading: boolean = false;
   @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private timelineService: TimelineService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required]
    });
  }

  ngOnInit(): void {
     this.today = new Date().toISOString().split('T')[0];
    this.userService.getTimeline().subscribe(items => {
      this.timelineItems = items;
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.previousPhotoUrl = ''; 
    }
  }

  async onSubmit() {
if (this.form.invalid || (!this.previousPhotoUrl && !this.selectedFile)) {
  this.toastr.error('Please fill in all fields and upload a photo before saving.', 'Validation Error');
  return;
}


    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.isLoading = true;
    const isEditing = !!this.editingId;
    this.toastr.info(isEditing ? 'Updating our memory... 📖✨' : 'Saving your beautiful memory... 💞');

    const formData = this.form.value;
    let photoUrl = this.previousPhotoUrl;

    try {
      if (this.selectedFile) {
        photoUrl = await this.timelineService.uploadImage(uid, this.selectedFile);
      }

      const updatedTimeline = await this.timelineService.addOrUpdateTimeline(
        uid,
        formData,
        photoUrl,
        this.editingId,
        this.deletePreviousPhoto
      );

      this.timelineItems = updatedTimeline ?? this.timelineItems;

      this.toastr.success(
        isEditing
          ? 'Memory updated successfully! 🌟'
          : 'New memory added to your love story! ❤️',
        'Success'
      );

      this.resetForm();
    } catch (error) {
      console.error('Timeline save failed:', error);
      this.toastr.error('Something went wrong. Please try again 💔', 'Oops!');
    } finally {
      this.isLoading = false;
    }
  }

  editItem(item: TimelineItem) {
    this.form.patchValue({
      title: item.title,
      description: item.description,
      date: item.date
    });

    this.editingId = item.id;
    this.previousPhotoUrl = item.photoUrl || '';
    this.deletePreviousPhoto=item.photoUrl || '';
    this.selectedFile = null;
  }

  async deleteItem(id: string) {
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.isLoading = true;
    this.toastr.info('Erasing a memory... but not the love ❤️', 'Please wait...');

    try {
      const updatedTimeline = await this.timelineService.deleteTimelineItem(uid, id);
      this.timelineItems = updatedTimeline ?? this.timelineItems;
      this.toastr.success('Memory deleted successfully. Love still remains! 💌', 'Deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      this.toastr.error('Oops! Something went wrong while deleting 💔', 'Error');
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
}


  resetForm() {
    this.form.reset();
    this.selectedFile = null;
    this.editingId = null;
    this.previousPhotoUrl = '';

     if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
