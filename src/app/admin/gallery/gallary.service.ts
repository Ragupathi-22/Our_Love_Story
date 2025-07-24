import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
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
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
import { GalleryItem } from '../../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  constructor(private firestore: Firestore, private storage: Storage) {}

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
    const filePath = `users/${uid}/gallery/images/${fileName}`;
    const storageRef = ref(this.storage, filePath);

    await uploadBytes(storageRef, fileToUpload);
    return await getDownloadURL(storageRef);
  }

  async addOrUpdateGallery(
    uid: string,
    formData: { title: string; date: string },
    photoUrl: string,
    editingId: string | null,
    previousPhotoUrl: string
  ): Promise<GalleryItem[]> {
    const galleryRef = collection(this.firestore, `users/${uid}/gallery`);

    if (editingId) {
      const itemRef = doc(this.firestore, `users/${uid}/gallery/${editingId}`);
      const snapshot = await getDoc(itemRef);
      const existing = snapshot.data() as GalleryItem | undefined;

      if (existing && photoUrl !== previousPhotoUrl && previousPhotoUrl) {
        await this.deleteImageFromStorage(previousPhotoUrl);
      }

      await updateDoc(itemRef, {
        title: formData.title,
        date: formData.date,
        photoUrl
      });
    } else {
      const newItem: GalleryItem = {
        id: uuidv4(),
        title: formData.title,
        date: formData.date,
        photoUrl
      };
      const docRef = await addDoc(galleryRef, newItem);
      await updateDoc(docRef, { id: docRef.id }); // ensure `id` is set inside the document
    }

    return this.getGallery(uid);
  }

  async deleteGalleryItem(uid: string, id: string): Promise<GalleryItem[]> {
    const itemRef = doc(this.firestore, `users/${uid}/gallery/${id}`);
    const snapshot = await getDoc(itemRef);
    const item = snapshot.data() as GalleryItem | undefined;

    if (item?.photoUrl) {
      await this.deleteImageFromStorage(item.photoUrl);
    }

    await deleteDoc(itemRef);
    return this.getGallery(uid);
  }

  async getGallery(uid: string): Promise<GalleryItem[]> {
    const galleryRef = collection(this.firestore, `users/${uid}/gallery`);
    const q = query(galleryRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as GalleryItem);
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
