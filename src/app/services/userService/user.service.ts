import { Injectable } from '@angular/core';
import { Auth, authState, signOut, User } from '@angular/fire/auth';
import { Firestore, collection, collectionData, doc, getDoc, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  UserProfile,
  PlaylistItem,
  GalleryItem,
  TimelineItem,
  ReminderItem,
  PeriodItem
} from '../../models/user-profile.model';
import { LoadingService } from '../../components/loading/loading.service';
import { CollectionReference, DocumentData, limit, orderBy, query, startAfter, updateDoc, where } from 'firebase/firestore';
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

  // getTimeline(): Observable<TimelineItem[]> {
  //   const uid = this.getUid();
  //   if (!uid) {
  //     return of([]);
  //   }

  //   const timelineRef = collection(
  //     this.firestore,
  //     `users/${uid}/timeline`
  //   ) as CollectionReference<TimelineItem>;

  //   const sortedQuery = query(timelineRef, orderBy('date', 'desc'));

  //   this.loadingService.show();

  //   return collectionData(sortedQuery, { idField: 'id' }).pipe(
  //     tap(() => this.loadingService.hide()),
  //     catchError((error) => {
  //       console.error('Error fetching timeline:', error);
  //       this.loadingService.hide();
  //       return of([]);
  //     })
  //   );
  // }

  private lastTimelineDoc: DocumentData | null = null;

  async getTimelinePage(pageSize: number = 20): Promise<TimelineItem[]> {
    const uid = this.getUid();
    if (!uid) return [];

    const timelineRef = collection(this.firestore, `users/${uid}/timeline`);
    
    let q;
    if (this.lastTimelineDoc) {
      q = query(timelineRef, orderBy('date', 'desc'), startAfter(this.lastTimelineDoc), limit(pageSize));
    } else {
      q = query(timelineRef, orderBy('date', 'desc'), limit(pageSize));
    }

    try {
      this.loadingService.show();
      const querySnapshot = await getDocs(q);
      const items: TimelineItem[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as TimelineItem;
        items.push({ ...data, id: doc.id });
      });

      this.lastTimelineDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      return items;
    } catch (error) {
      console.error('Error fetching timeline page:', error);
      return [];
    } finally {
      this.loadingService.hide();
    }
  }

  // Reset pagination (e.g., when refresh)
  resetTimelinePagination() {
    this.lastTimelineDoc = null;
  }

async getCurrentMonthTimeline(): Promise<TimelineItem[]> {
  const uid = this.getUid();
  if (!uid) return [];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const timelineRef = collection(this.firestore, `users/${uid}/timeline`);

  // Query only by month filter to avoid index issues
  const q = query(timelineRef, where('month', '==', currentMonth));

  try {
    this.loadingService.show();
    const querySnapshot = await getDocs(q);
    const items: TimelineItem[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data() as TimelineItem;
      items.push({ ...data, id: doc.id });
    });

    // Client-side sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  } catch (error) {
    console.error('Error fetching timeline for current month:', error);
    return [];
  } finally {
    this.loadingService.hide();
  }
}


//Gallery
// getGallery(): Observable<GalleryItem[]> {
//   this.loadingService.show();

//   return this.userProfile$.pipe(
//     switchMap(profile => {
//       if (!profile?.uid) {
//         this.loadingService.hide();
//         return of([]);
//       }

//       const galleryRef = collection(this.firestore, `users/${profile.uid}/gallery`);
//       const galleryQuery = query(galleryRef, orderBy('date', 'desc'));

//       return collectionData(galleryQuery, { idField: 'id' }) as Observable<GalleryItem[]>;
//     }),
//     tap(() => this.loadingService.hide()),
//     catchError(error => {
//       console.error('Error loading gallery:', error);
//       this.loadingService.hide();
//       return of([]);
//     })
//   );
// }
private lastGalleryDoc: DocumentData | null = null;

async getGalleryPage(pageSize: number = 20): Promise<GalleryItem[]> {
  const uid = this.getUid();
  if (!uid) return [];

  const galleryRef = collection(this.firestore, `users/${uid}/gallery`) as CollectionReference<GalleryItem>;

  let q;
  if (this.lastGalleryDoc) {
    q = query(galleryRef, orderBy('date', 'desc'), startAfter(this.lastGalleryDoc), limit(pageSize));
  } else {
    q = query(galleryRef, orderBy('date', 'desc'), limit(pageSize));
  }

  try {
    this.loadingService.show();
    const querySnapshot = await getDocs(q);
    const items: GalleryItem[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data() as GalleryItem;
      items.push({ ...data, id: doc.id });
    });
    this.lastGalleryDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    return items;
  } catch (error) {
    console.error('Error fetching gallery page:', error);
    return [];
  } finally {
    this.loadingService.hide();
  }
}

resetGalleryPagination() {
  this.lastGalleryDoc = null;
}

// Fetch only current month gallery items
async getCurrentMonthGallery(): Promise<GalleryItem[]> {
  const uid = this.getUid();
  if (!uid) return [];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const galleryRef = collection(this.firestore, `users/${uid}/gallery`) as CollectionReference<GalleryItem>;

  // Query by month field only, no orderBy for index safety
  const q = query(galleryRef, where('month', '==', currentMonth));

  try {
    this.loadingService.show();
    const querySnapshot = await getDocs(q);
    const items: GalleryItem[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data() as GalleryItem;
      items.push({ ...data, id: doc.id });
    });

    // Client-side sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  } catch (error) {
    console.error('Error fetching current month gallery:', error);
    return [];
  } finally {
    this.loadingService.hide();
  }
}


getPlaylists(): Observable<PlaylistItem[]> {
  this.loadingService.show();

  return this.userProfile$.pipe(
    switchMap(profile => {
      if (!profile?.uid) {
        this.loadingService.hide();
        return of([]);
      }

      const playlistsRef = collection(this.firestore, `users/${profile.uid}/playlists`);
      return collectionData(playlistsRef, { idField: 'id' }) as Observable<PlaylistItem[]>;
    }),
    tap(() => this.loadingService.hide()),
    catchError(error => {
      console.error('Error loading playlists:', error);
      this.loadingService.hide();
      return of([]);
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


}
