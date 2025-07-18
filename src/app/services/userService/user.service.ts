import { Injectable } from '@angular/core';
import { Auth, authState, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, from, map, Observable, of, switchMap } from 'rxjs';
import {
  UserProfile,
  PlaylistItem,
  GalleryItem,
  TimelineItem,
  ReminderItem,
  PeriodItem
} from '../../models/user-profile.model';
import { LoadingService } from '../../components/loading/loading.service';
import { updateDoc } from 'firebase/firestore';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private loadingService: LoadingService
  ) {
    authState(this.auth).subscribe(user => {
      this.currentUserSubject.next(user || null);
      if (user) {
        this.loadUserProfile(user.uid);
      } else {
        this.userProfileSubject.next(null);
      }
    });
  }

  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get userProfile$(): Observable<UserProfile | null> {
    return this.userProfileSubject.asObservable();
  }

  async loadUserProfile(uid: string) {
    try {
      this.loadingService.show();
      const userDocRef = doc(this.firestore, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        this.userProfileSubject.next(userSnap.data() as UserProfile);
      } else {
        this.userProfileSubject.next(null);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.userProfileSubject.next(null);
    } finally {
      this.loadingService.hide();
    }
  }

  getUserProfileValue(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  getUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  getUserProfile(): Observable<UserProfile | null> {
    this.loadingService.show(); // Show loading
    const uid = this.getCurrentUserId();
    if (!uid) {
      this.loadingService.hide(); // Hide loading immediately
      return of(null);
    }

    const userRef = doc(this.firestore, 'users', uid);
    return from(getDoc(userRef)).pipe(
      map(snapshot => {
        this.loadingService.hide(); // Hide after success
        const data = snapshot.data();
        return data ? { ...data, uid } as UserProfile : null;
      })
    );
  }

getTimeline(): Observable<TimelineItem[]> {
  this.loadingService.show();
  return this.userProfile$.pipe(
    map(profile => {
      this.loadingService.hide();

      const timeline = profile?.timeline ?? [];

      // Sort by date descending (latest to oldest)
      return timeline.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    })
  );
}


  getGallery(): Observable<GalleryItem[]> {
    this.loadingService.show();
    return this.userProfile$.pipe(
      map(profile => {
        this.loadingService.hide();
        return profile?.gallery ?? [];
      })
    );
  }

  getPlaylists(): Observable<PlaylistItem[]> {
    this.loadingService.show();
    return this.userProfile$.pipe(
      map(profile => {
        this.loadingService.hide();
        return profile?.playlists ?? [];
      })
    );
  }

getNoOfDays(): Observable<string> {
  this.loadingService.show();
  return this.userProfile$.pipe(
    map(profile => {
      this.loadingService.hide();
      const loveStartDate = profile?.loveStartDate;
      if (!loveStartDate) return '0';
      const startDate = new Date(loveStartDate);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // 🔁 FIXED here
      return days.toString();
    })
  );
}


  async logout(): Promise<void> {
  try {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    this.userProfileSubject.next(null);
  } catch (error) {
    console.error('Logout failed:', error);
  }
}


//Get Remainders
getReminders(): Observable<ReminderItem[]> {
  this.loadingService.show();
  return this.userProfile$.pipe(
    map(profile => {
      this.loadingService.hide();
      return profile?.reminders ?? [];
    })
  );
}

//add Reminder
async addReminder(reminder: ReminderItem): Promise<void> {
  const uid = this.getCurrentUserId();
  if (!uid) return;

  const userRef = doc(this.firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as UserProfile;
    const updatedReminders = [...(data.reminders ?? []), reminder];
    await updateDoc(userRef, { reminders: updatedReminders });
    this.loadUserProfile(uid);
  }
}

//delete Reminder
async deleteReminder(reminderId: string): Promise<void> {
  const uid = this.getCurrentUserId();
  if (!uid) return;

  const userRef = doc(this.firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as UserProfile;
    const updatedReminders = (data.reminders ?? []).filter(r => r.id !== reminderId);
    await updateDoc(userRef, { reminders: updatedReminders });
    this.loadUserProfile(uid);
  }
}


//get Periods
getPeriods(): Observable<PeriodItem[]> {
  this.loadingService.show();
  return this.userProfile$.pipe(
    map(profile => {
      this.loadingService.hide();
      return profile?.periods ?? [];
    })
  );
}

//add Period
async addPeriod(period: PeriodItem): Promise<void> {
  const uid = this.getCurrentUserId();
  if (!uid) return;

  const userRef = doc(this.firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as UserProfile;
    const updatedPeriods = [...(data.periods ?? []), period];
    await updateDoc(userRef, { periods: updatedPeriods });
    this.loadUserProfile(uid);
  }
}

async deletePeriod(periodId: string): Promise<void> {
  const uid = this.getCurrentUserId();
  if (!uid) return;

  const userRef = doc(this.firestore, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data() as UserProfile;
    const updatedPeriods = (data.periods ?? []).filter(p => p.id !== periodId);
    await updateDoc(userRef, { periods: updatedPeriods });
    this.loadUserProfile(uid);
  }
}


}
