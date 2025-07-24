import { Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc, deleteDoc,
  doc, docData, updateDoc, getDocs, query, orderBy, where
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { BucketItem, PeriodItem, ReminderItem } from '../../models/user-profile.model';
import { UserService } from '../userService/user.service';
import { LoadingService } from '../../components/loading/loading.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  constructor(
    private firestore: Firestore,
    private userService: UserService,
    private loadingService: LoadingService
  ) {}

  private getUid(): string | null {
    return this.userService.getCurrentUserId();
  }

  private getCollectionPath(type: 'reminders' | 'periods' | 'bucketList') {
    const uid = this.getUid();
    return `users/${uid}/${type}`;
  }

  // ─── Reminders ──────────────────────────────────────────────────────

  getReminders(): Observable<ReminderItem[]> {
    const uid = this.getUid();
    if (!uid) return of([]);

  

    const ref = collection(this.firestore, `users/${uid}/reminders`);
    const q = query(ref, orderBy('date', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
    ) as Observable<ReminderItem[]>;
  }

  async addReminder(reminder: ReminderItem): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;

    const ref = collection(this.firestore, `users/${uid}/reminders`);
    await addDoc(ref, reminder);
  }

  async deleteReminder(id: string): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;

    const ref = doc(this.firestore, `users/${uid}/reminders/${id}`);
    await deleteDoc(ref);
  }

  // ─── Periods ──────────────────────────────────────────────────────

  getPeriods(): Observable<PeriodItem[]> {
    const uid = this.getUid();
    if (!uid) return of([]);

  

    const ref = collection(this.firestore, `users/${uid}/periods`);
    const q = query(ref, orderBy('startDate', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
    ) as Observable<PeriodItem[]>;
  }

  async addPeriod(period: PeriodItem): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;

    const ref = collection(this.firestore, `users/${uid}/periods`);
    await addDoc(ref, period);
  }

  async deletePeriod(id: string): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;
  

    const ref = doc(this.firestore, `users/${uid}/periods/${id}`);
    await deleteDoc(ref);
  }

  // ─── Bucket List ──────────────────────────────────────────────────────

  getBucketList(): Observable<BucketItem[]> {
    const uid = this.getUid();
    if (!uid) return of([]);

  

    const ref = collection(this.firestore, `users/${uid}/bucketList`);
    const q = query(ref, orderBy('date', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
    ) as Observable<BucketItem[]>;
  }

  async addBucketItem(item: BucketItem): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;

    const ref = collection(this.firestore, `users/${uid}/bucketList`);
    await addDoc(ref, item);
  }

  async toggleBucketItemCompletion(id: string, completed: boolean): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;

    const ref = doc(this.firestore, `users/${uid}/bucketList/${id}`);
    await updateDoc(ref, { completed });
  }

  async deleteBucketItem(id: string): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;

    const ref = doc(this.firestore, `users/${uid}/bucketList/${id}`);
    await deleteDoc(ref);
  }
}
