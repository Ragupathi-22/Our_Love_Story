import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Auth, authState, UserProfile } from '@angular/fire/auth';
import { ToastrService } from 'ngx-toastr';
import { EmotionProfile, EmotionEntry, EmotionProfiles } from '../../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class EmotionService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private toastr = inject(ToastrService);

  currentUserUid = signal<string | null>(null);
  loggedInRole = signal<'he' | 'she' | null>(null);
  emotionData = signal<EmotionProfile | null>(null);
   allEmotionProfiles = signal<EmotionProfiles>({});
   fullProfile =signal<EmotionProfiles>({});
  constructor() {
    authState(this.auth).subscribe((user) => {
      this.currentUserUid.set(user?.uid ?? null);
    });
   
  }

  async loadAllEmotionProfiles() {
  const uid = this.currentUserUid();
  if (!uid) return;

  const userDoc = await getDoc(this.getUserDocRef(uid));
  const data = userDoc.data() as UserProfile;
  const profiles = data?.['emotionProfiles'] ?? {};

  this.fullProfile.set(profiles);
}

  private getUserDocRef(uid: string) {
    return doc(this.firestore, 'users', uid);
  }

  // Get current emotion profile (he/she)
  async loadEmotionProfile(role: 'he' | 'she') {
    const uid = this.currentUserUid();
    if (!uid) return;

    const userDoc = await getDoc(this.getUserDocRef(uid));
    const data = userDoc.data() as UserProfile;
     const profiles = data?.['emotionProfiles'] ?? {};
    this.allEmotionProfiles.set(profiles); 


   if ((data?.['emotionProfiles'] as any)?.[role]) {
     this.emotionData.set((data['emotionProfiles'] as any)[role])
      this.loggedInRole.set(role);
    }
  }

  // Register as he or she
  async registerEmotionProfile(role: 'he' | 'she', name: string, password: string) {
    const uid = this.currentUserUid();
    if (!uid) return;

    const userRef = this.getUserDocRef(uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;

    if ((userData['emotionProfiles'] as any)?.[role]) {
      this.toastr.error(`${role} is already registered.`);
      return;
    }

    const newProfile: EmotionProfile = {
      name,
      password,
      emotions: [],
    };

    await updateDoc(userRef, {
      [`emotionProfiles.${role}`]: newProfile,
    });

    this.toastr.success(`${role} registered successfully`);
    this.loadEmotionProfile(role);
     this.loadAllEmotionProfiles();
  }

  // Login to emotion profile
  async loginEmotionProfile(role: 'he' | 'she', password: string,name:string): Promise<boolean> {
    const uid = this.currentUserUid();
    if (!uid) return false;

    const userSnap = await getDoc(this.getUserDocRef(uid));
    const userData = userSnap.data() as UserProfile;
    const profile = (userData['emotionProfiles'] as any)?.[role];

    if (!profile) {
      this.toastr.error(`${role} not registered.`);
      return false;
    }

    if (profile.password !== password) {
      this.toastr.error('Incorrect password');
      return false;
    }
       if (profile.name !== name) {
      this.toastr.error('Incorrect name');
      return false;
    }

    this.emotionData.set(profile);
    this.loggedInRole.set(role);
     this.loadAllEmotionProfiles();
    this.toastr.success(`Welcome ${profile.name}`);
    return true;
  }

  // Add emotion entry
  async addEmotionEntry(entry: EmotionEntry) {
    const uid = this.currentUserUid();
    const role = this.loggedInRole();
    if (!uid || !role) return;

    const userRef = this.getUserDocRef(uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;

    const currentEmotions = (userData['emotionProfiles'] as any)?.[role]?.emotions ?? [];
    const updatedProfile = {
      ...(userData['emotionProfiles'] as any)?.[role],
      emotions: [...currentEmotions, entry],
    };

    await updateDoc(userRef, {
      [`emotionProfiles.${role}`]: updatedProfile,
    });

    this.emotionData.set(updatedProfile);
    this.toastr.success('Emotion added!');
    await this.cleanupOldEmotions(role);
  }

  // Logout
  logoutEmotion() {
    this.emotionData.set(null);
    this.loggedInRole.set(null);
    this.toastr.info('Logged out of emotion profile');
  }

getEmotionProfileByRole(role: 'he' | 'she'): EmotionProfile | null {

   const profiles = this.fullProfile();
  return profiles?.[role] || null;
  
}

getMonthlySummaryGrouped(): Promise<{
  [month: string]: {
    [user in 'he' | 'she']?: {
      [label: string]: number;
    };
  };
}> {
  return new Promise(async (resolve) => {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        console.warn('❌ No authenticated user found');
        resolve({});
        return;
      }

      const uid = user.uid;
      const docRef = doc(this.firestore, 'users', uid);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.warn('⚠️ User document does not exist');
        resolve({});
        return;
      }

      const docData = snapshot.data();

      const data = docData?.['emotionProfiles'];
      if (!data) {
        console.warn('⚠️ emotionProfiles not found in document');
        resolve({});
        return;
      }

      const summary: {
        [month: string]: {
          [user in 'he' | 'she']?: {
            [label: string]: number;
          };
        };
      } = {};

      ['he', 'she'].forEach((user) => {
        const profile = data[user];
        if (!profile) {
          return;
        }
        if (!profile.emotions || profile.emotions.length === 0) {
          return;
        }


        for (const entry of profile.emotions) {
          const entryDate = new Date(entry.date);
          const monthKey = `${entryDate.getFullYear()}-${(entryDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;

          if (!summary[monthKey]) summary[monthKey] = {};
          if (!summary[monthKey][user as 'he' | 'she']) {
            summary[monthKey][user as 'he' | 'she'] = {};
          }

          const label = entry.label;
          summary[monthKey][user as 'he' | 'she']![label] =
            (summary[monthKey][user as 'he' | 'she']![label] || 0) + 1;
        }
      });

      resolve(summary);
    } catch (error) {
      console.error('🔥 Error while generating monthly summary:', error);
      resolve({});
    }
  });
}

async cleanupOldEmotions(role: 'he' | 'she') {
  const uid = this.currentUserUid();
  if (!uid) return;

  const userRef = this.getUserDocRef(uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data() as UserProfile;
 const emotionProfiles = userData?.['emotionProfiles'] as EmotionProfiles;
const profile = emotionProfiles?.[role];


  if (!profile || !Array.isArray(profile.emotions)) return;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const filteredEmotions = profile.emotions.filter((entry:any) => {
    const entryDate = new Date(entry.date);
    return entryDate >= oneYearAgo;
  });

  const updatedProfile = {
    ...profile,
    emotions: filteredEmotions,
  };

  await updateDoc(userRef, {
    [`emotionProfiles.${role}`]: updatedProfile,
  });

  // Optional: Update local signals
  this.emotionData.set(updatedProfile);
  this.fullProfile.update((all) => ({
    ...all,
    [role]: updatedProfile,
  }));

  console.log(`✅ Cleaned up old emotions for '${role}'`);
}






}
