import { Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc, deleteDoc,
  doc, docData, updateDoc, getDocs, query, orderBy, where,
  CollectionReference,
  DocumentData,
  limit,
  startAfter
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


  private lastRemindersDoc: DocumentData | null = null;
  private lastPeriodsDoc: DocumentData | null = null;
  private lastBucketListDoc: DocumentData | null = null;

  // Reminders Pagination
  async getRemindersPage(pageSize: number = 20): Promise<ReminderItem[]> {
    const uid = this.getUid();
    if (!uid) return [];
    const remindersRef = collection(this.firestore, `users/${uid}/reminders`) as CollectionReference<ReminderItem>;
    let q;
    if (this.lastRemindersDoc) {
      q = query(remindersRef, orderBy('date', 'desc'), startAfter(this.lastRemindersDoc), limit(pageSize));
    } else {
      q = query(remindersRef, orderBy('date', 'desc'), limit(pageSize));
    }

    try {
      this.loadingService.show();
      const snapshot = await getDocs(q);
      const items: ReminderItem[] = [];
      snapshot.forEach(doc => items.push({ ...(doc.data() as ReminderItem), id: doc.id }));
      this.lastRemindersDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return items;
    } finally {
      this.loadingService.hide();
    }
  }

  resetRemindersPagination() {
    this.lastRemindersDoc = null;
  }

  // Periods Pagination
  async getPeriodsPage(pageSize: number = 20): Promise<PeriodItem[]> {
    const uid = this.getUid();
    if (!uid) return [];
    const periodsRef = collection(this.firestore, `users/${uid}/periods`) as CollectionReference<PeriodItem>;
    let q;
    if (this.lastPeriodsDoc) {
      q = query(periodsRef, orderBy('startDate', 'desc'), startAfter(this.lastPeriodsDoc), limit(pageSize));
    } else {
      q = query(periodsRef, orderBy('startDate', 'desc'), limit(pageSize));
    }

    try {
      this.loadingService.show();
      const snapshot = await getDocs(q);
      const items: PeriodItem[] = [];
      snapshot.forEach(doc => items.push({ ...(doc.data() as PeriodItem), id: doc.id }));
      this.lastPeriodsDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return items;
    } finally {
      this.loadingService.hide();
    }
  }

  resetPeriodsPagination() {
    this.lastPeriodsDoc = null;
  }

  // Bucket List Pagination
  async getBucketListPage(pageSize: number = 20): Promise<BucketItem[]> {
    const uid = this.getUid();
    if (!uid) return [];
    const bucketListRef = collection(this.firestore, `users/${uid}/bucketList`) as CollectionReference<BucketItem>;
    let q;
    if (this.lastBucketListDoc) {
      q = query(bucketListRef, orderBy('date', 'desc'), startAfter(this.lastBucketListDoc), limit(pageSize));
    } else {
      q = query(bucketListRef, orderBy('date', 'desc'), limit(pageSize));
    }

    try {
      this.loadingService.show();
      const snapshot = await getDocs(q);
      const items: BucketItem[] = [];
      snapshot.forEach(doc => items.push({ ...(doc.data() as BucketItem), id: doc.id }));
      this.lastBucketListDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return items;
    } finally {
      this.loadingService.hide();
    }
  }

  resetBucketListPagination() {
    this.lastBucketListDoc = null;
  }


  // ─── Reminders ──────────────────────────────────────────────────────

  // getReminders(): Observable<ReminderItem[]> {
  //   const uid = this.getUid();
  //   if (!uid) return of([]);

  

  //   const ref = collection(this.firestore, `users/${uid}/reminders`);
  //   const q = query(ref, orderBy('date', 'desc'));

  //   return collectionData(q, { idField: 'id' }).pipe(
  //   ) as Observable<ReminderItem[]>;
  // }

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

  // getPeriods(): Observable<PeriodItem[]> {
  //   const uid = this.getUid();
  //   if (!uid) return of([]);

  

  //   const ref = collection(this.firestore, `users/${uid}/periods`);
  //   const q = query(ref, orderBy('startDate', 'desc'));

  //   return collectionData(q, { idField: 'id' }).pipe(
  //   ) as Observable<PeriodItem[]>;
  // }

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

  // getBucketList(): Observable<BucketItem[]> {
  //   const uid = this.getUid();
  //   if (!uid) return of([]);

  

  //   const ref = collection(this.firestore, `users/${uid}/bucketList`);
  //   const q = query(ref, orderBy('date', 'desc'));

  //   return collectionData(q, { idField: 'id' }).pipe(
  //   ) as Observable<BucketItem[]>;
  // }

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
