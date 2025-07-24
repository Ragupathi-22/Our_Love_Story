import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  docData,
  DocumentReference
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
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
  fullProfile = signal<EmotionProfiles>({});

  constructor() {
    authState(this.auth).subscribe((user) => {
      this.currentUserUid.set(user?.uid ?? null);
    });
  }

  private getEmotionProfileRef(uid: string, role: 'he' | 'she'): DocumentReference {
    return doc(this.firestore, `users/${uid}/emotionProfiles/${role}`);
  }

  async loadAllEmotionProfiles() {
    const uid = this.currentUserUid();
    if (!uid) return;

    const emotionsCollection = collection(this.firestore, `users/${uid}/emotionProfiles`);
    const snapshots = await getDocs(emotionsCollection);

    const result: EmotionProfiles = {};
    snapshots.forEach((snap) => {
      result[snap.id as 'he' | 'she'] = snap.data() as EmotionProfile;
    });

    this.fullProfile.set(result);
  }

  async loadEmotionProfile(role: 'he' | 'she') {
    const uid = this.currentUserUid();
    if (!uid) return;

    const profileRef = this.getEmotionProfileRef(uid, role);
    const docSnap = await getDoc(profileRef);
    if (!docSnap.exists()) return;

    const profile = docSnap.data() as EmotionProfile;
    this.emotionData.set(profile);
    this.loggedInRole.set(role);

    await this.loadAllEmotionProfiles();
  }

  async registerEmotionProfile(role: 'he' | 'she', name: string, password: string) {
    const uid = this.currentUserUid();
    if (!uid) return;

    const profileRef = this.getEmotionProfileRef(uid, role);
    const existingSnap = await getDoc(profileRef);
    if (existingSnap.exists()) {
      this.toastr.error(`${role} is already registered.`);
      return;
    }

    const newProfile: EmotionProfile = {
      name,
      password,
      emotions: [],
    };

    await setDoc(profileRef, newProfile);

    this.toastr.success(`${role} registered successfully`);
    this.loadEmotionProfile(role);
    this.loadAllEmotionProfiles();
  }

  async loginEmotionProfile(role: 'he' | 'she', password: string, name: string): Promise<boolean> {
    const uid = this.currentUserUid();
    if (!uid) return false;

    const profileRef = this.getEmotionProfileRef(uid, role);
    const docSnap = await getDoc(profileRef);
    if (!docSnap.exists()) {
      this.toastr.error(`${role} not registered.`);
      return false;
    }

    const profile = docSnap.data() as EmotionProfile;

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
    await this.loadAllEmotionProfiles();
    this.toastr.success(`Welcome ${profile.name}`);
    return true;
  }

  async addEmotionEntry(entry: EmotionEntry) {
    const uid = this.currentUserUid();
    const role = this.loggedInRole();
    if (!uid || !role) return;

    const profileRef = this.getEmotionProfileRef(uid, role);
    const docSnap = await getDoc(profileRef);
    if (!docSnap.exists()) return;

    const profile = docSnap.data() as EmotionProfile;
    const updatedProfile: EmotionProfile = {
      ...profile,
      emotions: [...(profile.emotions ?? []), entry],
    };

    await setDoc(profileRef, updatedProfile);

    this.emotionData.set(updatedProfile);
    this.toastr.success('Emotion added!');
    await this.cleanupOldEmotions(role);
  }

  logoutEmotion() {
    this.emotionData.set(null);
    this.loggedInRole.set(null);
    this.toastr.info('Logged out of emotion profile');
  }

  getEmotionProfileByRole(role: 'he' | 'she'): EmotionProfile | null {
    const profiles = this.fullProfile();
    return profiles?.[role] || null;
  }

  async getMonthlySummaryGrouped(): Promise<{
    [month: string]: {
      [user in 'he' | 'she']?: {
        [label: string]: number;
      };
    };
  }> {
    const uid = this.currentUserUid();
    if (!uid) return {};

    const emotionsCollection = collection(this.firestore, `users/${uid}/emotionProfiles`);
    const snapshots = await getDocs(emotionsCollection);

    const summary: {
      [month: string]: {
        [user in 'he' | 'she']?: {
          [label: string]: number;
        };
      };
    } = {};

    for (const docSnap of snapshots.docs) {
      const user = docSnap.id as 'he' | 'she';
      const profile = docSnap.data() as EmotionProfile;

      for (const entry of profile.emotions || []) {
        const entryDate = new Date(entry.date);
        const monthKey = `${entryDate.getFullYear()}-${(entryDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        if (!summary[monthKey]) summary[monthKey] = {};
        if (!summary[monthKey][user]) summary[monthKey][user] = {};

        const label = entry.label;
        summary[monthKey][user]![label] =
          (summary[monthKey][user]![label] || 0) + 1;
      }
    }

    return summary;
  }

  async cleanupOldEmotions(role: 'he' | 'she') {
    const uid = this.currentUserUid();
    if (!uid) return;

    const profileRef = this.getEmotionProfileRef(uid, role);
    const docSnap = await getDoc(profileRef);
    if (!docSnap.exists()) return;

    const profile = docSnap.data() as EmotionProfile;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filteredEmotions = profile.emotions.filter((entry: any) => {
      const entryDate = new Date(entry.date);
      return entryDate >= oneYearAgo;
    });

    const updatedProfile = {
      ...profile,
      emotions: filteredEmotions,
    };

    await setDoc(profileRef, updatedProfile);

    this.emotionData.set(updatedProfile);
    this.fullProfile.update((all) => ({
      ...all,
      [role]: updatedProfile,
    }));

    console.log(`✅ Cleaned up old emotions for '${role}'`);
  }
}
