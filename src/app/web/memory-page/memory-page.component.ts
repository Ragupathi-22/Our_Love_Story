import { Component, computed, inject, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ReminderItem, PeriodItem, BucketItem } from '../../models/user-profile.model';
import { LucideAngularModule, X, HeartIcon, Bell, Calendar } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MemoryService } from '../../services/memoryService/memory.service';
import { ConfirmDialogService } from '../../services/confirmationService/confirm_dialog.service';


@Component({
  selector: 'app-memory-page',
  standalone: true,
  templateUrl: './memory-page.component.html',
  styleUrls: ['./memory-page.component.css'],
  imports: [LucideAngularModule, CommonModule, FormsModule]
})
export class MemoryPageComponent {
  x = X;
  heart = HeartIcon;
  bell = Bell;
  calendar = Calendar;

  private memoryService = inject(MemoryService);
  private toastr = inject(ToastrService);

  activeTab = signal<'reminders' | 'period' | 'bucket'>('reminders');
  activeReminderTab = signal<'thisMonth' | 'all'>('thisMonth');
  reminderSearchTerm = signal('');

  // Data arrays
  reminders = signal<ReminderItem[]>([]);
  periods = signal<PeriodItem[]>([]);
  bucketList = signal<BucketItem[]>([]);

  // Pagination state flags
  isLoadingReminders = signal(false);
  allRemindersLoaded = signal(false);

  isLoadingPeriods = signal(false);
  allPeriodsLoaded = signal(false);

  isLoadingBucketList = signal(false);
  allBucketListLoaded = signal(false);

  // Signal for new items
  newReminder = signal<{ text: string; date: string }>({ text: '', date: '' });
  newPeriod = signal<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });
  newBucketItem = signal<{ title: string; date: string }>({ title: '', date: '' });

  isLoading = signal(false);

  constructor(private confirmDialog: ConfirmDialogService) {
    this.resetAllPagination();
  }

  resetAllPagination() {
    this.resetRemindersPagination();
    this.resetPeriodsPagination();
    this.resetBucketListPagination();
  }

  // -------- Reminders --------
  async loadNextRemindersPage() {
    if (this.isLoadingReminders() || this.allRemindersLoaded()) return;
    this.isLoadingReminders.set(true);
    const newItems = await this.memoryService.getRemindersPage(20);
    if (newItems.length === 0) {
      this.allRemindersLoaded.set(true);
    } else {
      this.reminders.update(items => [...items, ...newItems]);
    }
    this.isLoadingReminders.set(false);
  }

  resetRemindersPagination() {
    this.memoryService.resetRemindersPagination();
    this.reminders.set([]);
    this.allRemindersLoaded.set(false);
    this.loadNextRemindersPage();
  }

  // -------- Periods --------
  async loadNextPeriodsPage() {
    if (this.isLoadingPeriods() || this.allPeriodsLoaded()) return;
    this.isLoadingPeriods.set(true);
    const newItems = await this.memoryService.getPeriodsPage(20);
    if (newItems.length === 0) {
      this.allPeriodsLoaded.set(true);
    } else {
      this.periods.update(items => [...items, ...newItems]);
    }
    this.isLoadingPeriods.set(false);
  }

  resetPeriodsPagination() {
    this.memoryService.resetPeriodsPagination();
    this.periods.set([]);
    this.allPeriodsLoaded.set(false);
    this.loadNextPeriodsPage();
  }

  // -------- Bucket List --------
  async loadNextBucketListPage() {
    if (this.isLoadingBucketList() || this.allBucketListLoaded()) return;
    this.isLoadingBucketList.set(true);
    const newItems = await this.memoryService.getBucketListPage(20);
    if (newItems.length === 0) {
      this.allBucketListLoaded.set(true);
    } else {
      this.bucketList.update(items => [...items, ...newItems]);
    }
    this.isLoadingBucketList.set(false);
  }

  resetBucketListPagination() {
    this.memoryService.resetBucketListPagination();
    this.bucketList.set([]);
    this.allBucketListLoaded.set(false);
    this.loadNextBucketListPage();
  }

  // -------- CRUD Operations --------

  async addReminder() {
    const { text, date } = this.newReminder();
    if (!text || !date) {
      this.toastr.error('Please fill in both title and date...!');
      return;
    }

    this.isLoading.set(true);
    try {
      const reminder: ReminderItem = { id: uuidv4(), title: text, date };
      await this.memoryService.addReminder(reminder);
      this.newReminder.set({ text: '', date: '' });
      this.resetRemindersPagination();
      this.toastr.success('Event added!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteReminder(r: any) {

    const confirmed = await this.confirmDialog.show(
      'Delete Reminder',
     `Are you sure you want to delete the Event?\n${r.title}`,
      'Yes, Delete',
      'No, Cancel'
    );
    if(!confirmed) return;
    this.isLoading.set(true);
    try {
      await this.memoryService.deleteReminder(r.id);
      this.resetRemindersPagination();
      this.toastr.success('Event deleted!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async addPeriod() {
    const { startDate, endDate } = this.newPeriod();
    if (!startDate || !endDate) {
      this.toastr.error('Please make sure all fields are filled out...!');
      return;
    }

    this.isLoading.set(true);
    try {
      const period: PeriodItem = { id: uuidv4(), startDate, endDate };
      await this.memoryService.addPeriod(period);
      this.newPeriod.set({ startDate: '', endDate: '' });
      this.resetPeriodsPagination();
      this.toastr.success('Period added!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deletePeriod(item: any) {

    const confirmed = await this.confirmDialog.show(
      'Delete Period',
     `Are you sure you want to delete the Period?\n start: ${this.formatDate(item.startDate)}, end: ${this.formatDate(item.endDate)}`,
      'Yes, Delete',
      'No, Cancel'
    );
    if(!confirmed) return;
    this.isLoading.set(true);
    try {
      await this.memoryService.deletePeriod(item.id);
      this.resetPeriodsPagination();
      this.toastr.success('Period deleted!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async addBucketItem() {
    const { title, date } = this.newBucketItem();
    if (!title || !date) {
      this.toastr.error('Please fill in both title and date');
      return;
    }

    this.isLoading.set(true);
    try {
      const item: BucketItem = { id: uuidv4(), title, date, completed: false };
      await this.memoryService.addBucketItem(item);
      this.newBucketItem.set({ title: '', date: '' });
      this.resetBucketListPagination();
      this.toastr.success('Bucket list item added!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteBucketItem(item: any) {
        const confirmed = await this.confirmDialog.show(
      'Delete Bucket Item',
     `Are you sure you want to delete?\n${item.title}`,
      'Yes, Delete',
      'No, Cancel'
    );
    if(!confirmed) return;
    this.isLoading.set(true);
    try {
      await this.memoryService.deleteBucketItem(item.id);
      this.resetBucketListPagination();
      this.toastr.success('Item deleted');
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleBucketCompleted(id: string, completed: boolean) {
    this.isLoading.set(true);
    try {
      await this.memoryService.toggleBucketItemCompletion(id, completed);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Computed properties and helpers here...

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  }

  getPeriodWidth(start: string, end: string): number {
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24) + 1;
    return diff * 10;
  }

  nextPeriod = computed(() => {
    const sorted = [...this.periods()].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    if (sorted.length === 0) return null;

    const last = sorted[0];
    const lastEnd = new Date(last.endDate);
    const lastStart = new Date(last.startDate);
    if (isNaN(lastEnd.getTime()) || isNaN(lastStart.getTime())) return null;

    const nextStart = new Date(lastEnd);
    nextStart.setDate(nextStart.getDate() + 28);

    const duration = Math.round((lastEnd.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24));
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextStart.getDate() + duration);

    return {
      startDate: this.formatDate(nextStart.toISOString().split('T')[0]),
      endDate: this.formatDate(nextEnd.toISOString().split('T')[0]),
    };
  });

  // Optionally, filter logic for reminders, etc.
  filteredReminders = computed(() => {
    const search = this.reminderSearchTerm().toLowerCase();
    return this.reminders()
      .filter(reminder => {
        const matchesSearch = reminder.title.toLowerCase().includes(search);
        const reminderMonth = new Date(reminder.date).getMonth();
        const currentMonth = new Date().getMonth();

        if (this.activeReminderTab() === 'thisMonth') {
          return reminderMonth === currentMonth && matchesSearch;
        } else {
          return matchesSearch;
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });


  updateReminderText(text: string) {
    const current = this.newReminder();
    this.newReminder.set({ ...current, text });
  }

  updateReminderDate(date: string) {
    const current = this.newReminder();
    this.newReminder.set({ ...current, date });
  }

  updatePeriodStart(startDate: string) {
    const current = this.newPeriod();
    this.newPeriod.set({ ...current, startDate });
  }

  updatePeriodEnd(endDate: string) {
    const current = this.newPeriod();
    this.newPeriod.set({ ...current, endDate });
  }

  updateBucketTitle(title: string) {
    const curr = this.newBucketItem();
    this.newBucketItem.set({ ...curr, title });
  }

  updateBucketDate(date: string) {
    const curr = this.newBucketItem();
    this.newBucketItem.set({ ...curr, date });
  }
}
