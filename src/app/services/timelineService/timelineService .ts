import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  CollectionReference,
  query,
  orderBy
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';
import { TimelineItem } from '../../models/user-profile.model';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  constructor(private firestore: Firestore, private storage: Storage) {}

  // ✅ Upload and optionally compress image
  async uploadImage(uid: string, file: File): Promise<string> {
    let fileToUpload = file;

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

  // ✅ Add or update a timeline item in the subcollection
  async addOrUpdateTimeline(
    uid: string,
    formData: any,
    photoUrl: string,
    editingId: string | null,
    deletePreviousPhoto: string
  ) {
    const timelineCollection = collection(
      this.firestore,
      `users/${uid}/timeline`
    ) as CollectionReference<TimelineItem>;

    if (editingId) {
      const itemRef = doc(this.firestore, `users/${uid}/timeline/${editingId}`);
      const updatedItem: TimelineItem = {
        id: editingId,
        ...formData,
        photoUrl
      };

      if (photoUrl && deletePreviousPhoto && photoUrl !== deletePreviousPhoto) {
        await this.deleteImageFromStorage(deletePreviousPhoto);
      }

      await setDoc(itemRef, updatedItem, { merge: true });
    } else {
      const id = uuidv4();
      const itemRef = doc(this.firestore, `users/${uid}/timeline/${id}`);
      const newItem: TimelineItem = {
        id,
        ...formData,
        photoUrl
      };

      await setDoc(itemRef, newItem);
    }
  }



  // ✅ Delete a single timeline item and its photo
  async deleteTimelineItem(uid: string, id: string) {
    const itemRef = doc(this.firestore, `users/${uid}/timeline/${id}`);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) return;

    const item = itemSnap.data() as TimelineItem;

    if (item.photoUrl) {
      await this.deleteImageFromStorage(item.photoUrl);
    }

    await deleteDoc(itemRef);
  }

  // ✅ Remove image from Firebase Storage
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
