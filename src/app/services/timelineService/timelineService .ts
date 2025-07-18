import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { TimelineItem } from '../../models/user-profile.model';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  constructor(private firestore: Firestore, private storage: Storage) {}

async uploadImage(uid: string, file: File): Promise<string> {
  let fileToUpload = file;

  // Compress only if file is larger than 5MB
  if (file.size > 5 * 1024 * 1024) {
    fileToUpload = await imageCompression(file, {
      maxSizeMB: 5, 
      maxWidthOrHeight: 1920, 
      initialQuality: 0.9, 
      useWebWorker: true
    });
  }

  const fileName = `${uuidv4()}_${fileToUpload.name}`;
  const filePath = `users/${uid}/timeline/images/${fileName}`;
  const storageRef = ref(this.storage, filePath);

  await uploadBytes(storageRef, fileToUpload);
  return await getDownloadURL(storageRef);
}


async addOrUpdateTimeline(
  uid: string,
  formData: any,
  photoUrl: string,
  editingId: string | null,
  deletePreviousPhoto: string
) {
  const userRef = doc(this.firestore, 'users', uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();
  if (!userData) return;

  const timeline: TimelineItem[] = [...(userData['timeline'] || [])];

  if (editingId) {
    const index = timeline.findIndex(item => item.id === editingId);
    if (index !== -1) {
      // ✅ Delete previous image if a new one is uploaded
      if (photoUrl && deletePreviousPhoto && photoUrl !== deletePreviousPhoto) {
        await this.deleteImageFromStorage(deletePreviousPhoto);
      }

      timeline[index] = { ...timeline[index], ...formData, photoUrl };
    }
  } else {
    timeline.push({
      id: uuidv4(),
      ...formData,
      photoUrl
    });
  }

  await updateDoc(userRef, { timeline });
  return timeline;
}

  async deleteTimelineItem(uid: string, id: string) {
    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    const userData = snapshot.data();
    if (!userData) return;

    const timeline: TimelineItem[] = userData['timeline'] || [];
    const item = timeline.find(i => i.id === id);

    // Delete image from storage
    if (item?.photoUrl) {
      try {
        const url = new URL(item.photoUrl);
        const path = decodeURIComponent(url.pathname.replace(/^\/v0\/b\/[^/]+\/o\//, '').replace(/%2F/g, '/'));
        const fileRef = ref(this.storage, path);
        await deleteObject(fileRef);
      } catch (error) {
        console.warn('Failed to delete image from storage:', error);
      }
    }

    const updatedTimeline = timeline.filter(i => i.id !== id);
    await updateDoc(userRef, { timeline: updatedTimeline });
    return updatedTimeline;
  }

  async deleteImageFromStorage(photoUrl: string): Promise<void> {
  try {
    const url = new URL(photoUrl);
    const path = decodeURIComponent(
      url.pathname.replace(/^\/v0\/b\/[^/]+\/o\//, '').replace(/%2F/g, '/')
    );
    const fileRef = ref(this.storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn('Failed to delete image from storage:', error);
  }
}
}
