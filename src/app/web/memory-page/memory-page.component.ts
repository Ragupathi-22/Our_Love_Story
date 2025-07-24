// memory-page.component.ts
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ReminderItem, PeriodItem, BucketItem } from '../../models/user-profile.model';
import { LucideAngularModule, X, HeartIcon, Bell, Calendar } from 'lucide-angular';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MemoryService } from '../../services/memoryService/memory.service';
import { UserService } from '../../services/userService/user.service';
import { LoadingService } from '../../components/loading/loading.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-memory-page',
  standalone: true,
  templateUrl: './memory-page.component.html',
  styleUrls: ['./memory-page.component.css'],
  imports: [LucideAngularModule, CommonModule, FormsModule]
})
export class MemoryPageComponent implements OnInit {
  x = X;
  heart = HeartIcon;
  bell = Bell;
  calendar = Calendar;


  private memoryService = inject(MemoryService);
  private userService = inject(UserService)
  activeTab = signal<'reminders' | 'period' | 'bucket'>('reminders');
  refreshTrigger = signal(0);
  activeReminderTab = signal<'thisMonth' | 'all'>('thisMonth');
  reminderSearchTerm = signal('');


  readonly reminders = signal<ReminderItem[]>([]);
  readonly periods = signal<PeriodItem[]>([]);
  readonly bucketList = signal<BucketItem[]>([]);

  newReminder = signal<{ text: string; date: string }>({ text: '', date: '' });
  newPeriod = signal<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });
  newBucketItem = signal<{ title: string; date: string }>({ title: '', date: '' });

  isAddingReminder = signal(false);
  isDeletingReminder = signal(false);
  isAddingPeriod = signal(false);
  isDeletingPeriod = signal(false);
  isLoading = signal(false);


constructor(private toastr: ToastrService,private loadingService:LoadingService) {

}

ngOnInit(): void {
  const uid = this.userService.getUid(); // or from a UID signal
  if (!uid) return;

  this.loadingService.show();

  const reminders$ = this.memoryService.getReminders();
  const periods$ = this.memoryService.getPeriods();
  const bucketList$ = this.memoryService.getBucketList();

  combineLatest([reminders$, periods$, bucketList$]).subscribe(
    ([reminders, periods, bucket]) => {
      this.reminders.set(
        reminders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      this.periods.set(
        periods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      );
      this.bucketList.set(
        bucket.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );

      this.loadingService.hide(); // ✅ Hide loading only once everything is fetched
    },
    (error) => {
      console.error('Error loading data:', error);
      this.loadingService.hide(); // Still hide if an error occurs
    }
  );
}

  showToast(msg: string) {
    this.toastr.success(msg);
  }

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

  async addReminder() {
    const { text, date } = this.newReminder();
    if (!text || !date) {
      this.toastr.error('Please fill in both title and date...!')
      return
    };

    this.isLoading.set(true);
    try {
      const reminder: ReminderItem = { id: uuidv4(), title: text, date };
      await this.memoryService.addReminder(reminder);
      this.newReminder.set({ text: '', date: '' });
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Event added!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteReminder(id: string) {
    this.isLoading.set(true);
    try {
      await this.memoryService.deleteReminder(id);
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Event deleted!');
    } finally {
      this.isLoading.set(false);
    }
  }

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



  async addPeriod() {
    const { startDate, endDate } = this.newPeriod();
    if (!startDate || !endDate) {
      this.toastr.error('Please make sure all fields are filled out...!')
      return
    };

    this.isLoading.set(true);
    try {
      const period: PeriodItem = { id: uuidv4(), startDate, endDate };
      await this.memoryService.addPeriod(period);
      this.newPeriod.set({ startDate: '', endDate: '' });
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Period added!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deletePeriod(id: string) {
    this.isLoading.set(true);
    try {
      await this.memoryService.deletePeriod(id);
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Period deleted!');
    } finally {
      this.isLoading.set(false);
    }
  }

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

  async addBucketItem() {
    const { title, date } = this.newBucketItem();
    if (!title || !date) {
      this.toastr.error('Please fill in both title and date');
      return;
    }

    this.isLoading.set(true);
    try {
      const item: BucketItem = {
        id: uuidv4(),
        title,
        date,
        completed: false
      };
      await this.memoryService.addBucketItem(item);
      this.newBucketItem.set({ title: '', date: '' });
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Bucket list item added!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteBucketItem(id: string) {
    this.isLoading.set(true);
    try {
      await this.memoryService.deleteBucketItem(id);
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Item deleted');
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

}
