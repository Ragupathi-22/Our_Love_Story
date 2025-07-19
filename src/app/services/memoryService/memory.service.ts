import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, map, of } from 'rxjs';
import { BucketItem, PeriodItem, ReminderItem, UserProfile } from '../../models/user-profile.model';
import { UserService } from '../userService/user.service';
import { LoadingService } from '../../components/loading/loading.service';

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  constructor(
    private firestore: Firestore,
    private userService: UserService,
    private loadingService: LoadingService
  ) {}

  // ✅ Reminder Methods
  getReminders(): Observable<ReminderItem[]> {
    this.loadingService.show();
    return this.userService.userProfile$.pipe(
      map(profile => {
        this.loadingService.hide();
        return profile?.reminders ?? [];
      })
    );
  }

  async addReminder(reminder: ReminderItem): Promise<void> {
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      const updatedReminders = [...(data.reminders ?? []), reminder];
      await updateDoc(userRef, { reminders: updatedReminders });
      this.userService.loadUserProfile(uid);
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      const updatedReminders = (data.reminders ?? []).filter(r => r.id !== reminderId);
      await updateDoc(userRef, { reminders: updatedReminders });
      this.userService.loadUserProfile(uid);
    }
  }

  // ✅ Period Methods
  getPeriods(): Observable<PeriodItem[]> {
    this.loadingService.show();
    return this.userService.userProfile$.pipe(
      map(profile => {
        this.loadingService.hide();
        return profile?.periods ?? [];
      })
    );
  }

  async addPeriod(period: PeriodItem): Promise<void> {
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      const updatedPeriods = [...(data.periods ?? []), period];
      await updateDoc(userRef, { periods: updatedPeriods });
      this.userService.loadUserProfile(uid);
    }
  }

  async deletePeriod(periodId: string): Promise<void> {
    const uid = this.userService.getCurrentUserId();
    if (!uid) return;

    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      const updatedPeriods = (data.periods ?? []).filter(p => p.id !== periodId);
      await updateDoc(userRef, { periods: updatedPeriods });
      this.userService.loadUserProfile(uid);
    }
  }

  
// Get Bucket List
getBucketList(): Observable<BucketItem[]> {
  this.loadingService.show();
  return this.userService.userProfile$.pipe(
    map(profile => {
      this.loadingService.hide();
      return profile?.bucketList ?? [];
    })
  );
}

// Add Bucket Item
async addBucketItem(item: BucketItem): Promise<void> {
  const uid = this.userService.getCurrentUserId();
  if (!uid) return;
  const userRef = doc(this.firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as UserProfile;
    const updated = [...(data.bucketList ?? []), item];
    await updateDoc(userRef, { bucketList: updated });
    this.userService.loadUserProfile(uid);
  }
}

// Toggle Complete
async toggleBucketItemCompletion(id: string, completed: boolean): Promise<void> {
  const uid = this.userService.getCurrentUserId();
  if (!uid) return;
  const userRef = doc(this.firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as UserProfile;
    const updated = (data.bucketList ?? []).map(item =>
      item.id === id ? { ...item, completed } : item
    );
    await updateDoc(userRef, { bucketList: updated });
    this.userService.loadUserProfile(uid);
  }
}

// Delete Bucket Item
async deleteBucketItem(id: string): Promise<void> {
  const uid = this.userService.getCurrentUserId();
  if (!uid) return;
  const userRef = doc(this.firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as UserProfile;
    const updated = (data.bucketList ?? []).filter(item => item.id !== id);
    await updateDoc(userRef, { bucketList: updated });
    this.userService.loadUserProfile(uid);
  }
}
}
