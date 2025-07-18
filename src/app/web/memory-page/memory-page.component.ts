// memory-page.component.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ReminderItem, PeriodItem } from '../../models/user-profile.model';
import { UserService } from '../../services/userService/user.service';
import { LucideAngularModule, X, HeartIcon, Bell, Calendar } from 'lucide-angular';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  ToastrService } from 'ngx-toastr';

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
 

  private userService = inject(UserService);

  activeTab = signal<'reminders' | 'period'>('reminders');

  refreshTrigger = signal(0);

readonly reminders = signal<ReminderItem[]>([]);
readonly periods = signal<PeriodItem[]>([]);


constructor(private toastr :ToastrService) {
  effect(() => {
    this.userService.userProfile$.subscribe(profile => {
      const sortedReminders = (profile?.reminders ?? []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const sortedPeriods = (profile?.periods ?? []).sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      this.reminders.set(sortedReminders);
      this.periods.set(sortedPeriods);
    });
  });
}

  newReminder = signal<{ text: string; date: string }>({ text: '', date: '' });
  newPeriod = signal<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });

  isAddingReminder = signal(false);
  isDeletingReminder = signal(false);
  isAddingPeriod = signal(false);
  isDeletingPeriod = signal(false);
  isLoading = signal(false);

  showToast(msg: string) {
    this.toastr.warning(msg);
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

  async addReminder() {
    const { text, date } = this.newReminder();
    if (!text || !date){
      this.toastr.error('Please make sure all fields are filled out...!')
      return};

    this.isLoading.set(true);
    try {
      const reminder: ReminderItem = { id: uuidv4(), title: text, date };
      await this.userService.addReminder(reminder);
      this.newReminder.set({ text: '', date: '' });
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Reminder added!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteReminder(id: string) {
    this.isLoading.set(true);
    try {
      await this.userService.deleteReminder(id);
      this.refreshTrigger.update(v => v + 1);
      this.showToast('Reminder deleted!');
    } finally {
      this.isLoading.set(false);
    }
  }

  async addPeriod() {
    const { startDate, endDate } = this.newPeriod();
    if (!startDate || !endDate) {
      this.toastr.error('Please make sure all fields are filled out...!')
      return};

    this.isLoading.set(true);
    try {
      const period: PeriodItem = { id: uuidv4(), startDate, endDate };
      await this.userService.addPeriod(period);
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
      await this.userService.deletePeriod(id);
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
}
