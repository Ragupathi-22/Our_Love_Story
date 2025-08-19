import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/userService/user.service';
import { TimelineItem } from '../../models/user-profile.model';
import { TimelineService } from '../../services/timelineService/timelineService ';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Edit, Trash } from 'lucide-angular';
import { ConfirmDialogService } from '../../services/confirmationService/confirm_dialog.service';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './timeline.component.html'
})
export class TimelineComponent implements OnInit {
  editIco = Edit;
  deleteIco = Trash;
  form: FormGroup;
  today: string = '';
  timelineItems: TimelineItem[] = [];
  editingId: string | null = null;
  selectedFile: File | null = null;
  previousPhotoUrl: string = '';
  deletePreviousPhoto: string = '';
  isLoading: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Pagination-specific
  allLoaded = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private timelineService: TimelineService,
    private toastr: ToastrService,
    private confirmService: ConfirmDialogService

  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.today = new Date().toISOString().split('T')[0];
    this.refreshTimeline();
  }

  async loadNextPage() {
    if (this.isLoading || this.allLoaded) return;
    this.isLoading = true;
    // Use your paginated fetch like journey side
    const newItems = await this.userService.getTimelinePage(20);
    if (newItems.length === 0) {
      this.allLoaded = true;
    } else {
      this.timelineItems = [...this.timelineItems, ...newItems];
    }
    this.isLoading = false;
  }

  refreshTimeline() {
    this.userService.resetTimelinePagination();
    this.timelineItems = [];
    this.allLoaded = false;
    this.loadNextPage();
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

      if (updatedTimeline) {
        if (isEditing) {
          // Find the item and update it
          const index = this.timelineItems.findIndex(item => item.id === this.editingId);
          if (index > -1) {
            this.timelineItems[index] = updatedTimeline;
          }
        } else {
          // Add new item to the start (assuming newest items at top)
          this.timelineItems.unshift(updatedTimeline);
        }
      } else {
        // Fallback to refresh if you want full consistency
        this.refreshTimeline();
      }

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
    this.deletePreviousPhoto = item.photoUrl || '';
    this.selectedFile = null;
  }

  async deleteItem(item: any) {
  
    const confirmed = await this.confirmService.show(
      'Delete Memory',
      `Are you sure you want to delete this memory?\n${item.title}`,
      'Yes, delete it',
      'No, keep it'
    );

    if (!confirmed) return;
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    this.isLoading = true;
    this.toastr.info('Erasing a memory... but not the love ❤️', 'Please wait...');

    try {
      const success = await this.timelineService.deleteTimelineItem(uid, item.id);
      if (success) {
        // Remove deleted item from timelineItems
        this.timelineItems = this.timelineItems.filter(item => item.id !== item.id);
        this.toastr.success('Memory deleted successfully. Love still remains! 💌', 'Deleted');
      } else {
        this.toastr.error('Failed to delete the memory. Please try again.', 'Error');
      }
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
