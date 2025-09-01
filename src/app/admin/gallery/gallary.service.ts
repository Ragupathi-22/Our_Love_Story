import {
  Firestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  CollectionReference,
  DocumentData,
  limit,
  startAfter,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
import { GalleryItem } from '../../models/user-profile.model';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private lastGalleryDoc: DocumentData | null = null;

  constructor(private firestore: Firestore, private storage: Storage) {}

  async uploadImage(uid: string, file: File): Promise<string> {
    let fileToUpload = file;

    if (file.size > 5 * 1024 * 1024) {
      fileToUpload = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: 1920,
        initialQuality: 0.9,
        useWebWorker: true,
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
): Promise<GalleryItem | null> {
  const galleryRef = collection(this.firestore, `users/${uid}/gallery`);
  const month = new Date(formData.date).getMonth() + 1; // Extract month (1-12)

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
      photoUrl,
      month
    });

    return { id: editingId, ...formData, photoUrl, month } as GalleryItem;
  } else {
    const newItem: GalleryItem = {
      id: uuidv4(),
      title: formData.title,
      date: formData.date,
      photoUrl,
      month
    };
    const docRef = await addDoc(galleryRef, newItem);
    await updateDoc(docRef, { id: docRef.id });

    return { ...newItem, id: docRef.id };
  }
}


  async deleteGalleryItem(uid: string, id: string): Promise<boolean> {
    const itemRef = doc(this.firestore, `users/${uid}/gallery/${id}`);
    const snapshot = await getDoc(itemRef);
    const item = snapshot.data() as GalleryItem | undefined;

    if (item?.photoUrl) {
      await this.deleteImageFromStorage(item.photoUrl);
    }

    await deleteDoc(itemRef);
    return true;
  }

  async getGalleryPage(
    uid: string,
    pageSize: number = 20
  ): Promise<GalleryItem[]> {
    if (!uid) return [];

    const galleryRef = collection(
      this.firestore,
      `users/${uid}/gallery`
    ) as CollectionReference<GalleryItem>;

    let q;
    if (this.lastGalleryDoc) {
      q = query(
        galleryRef,
        orderBy('date', 'desc'),
        startAfter(this.lastGalleryDoc),
        limit(pageSize)
      );
    } else {
      q = query(galleryRef, orderBy('date', 'desc'), limit(pageSize));
    }

    try {
      const snapshot = await getDocs(q);
      const items: GalleryItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as GalleryItem);
      });
      this.lastGalleryDoc =
        snapshot.docs[snapshot.docs.length - 1] || null;
      return items;
    } catch (error) {
      console.error('Error fetching gallery page:', error);
      return [];
    }
  }

  resetGalleryPagination() {
    this.lastGalleryDoc = null;
  }

  async deleteImageFromStorage(photoUrl: string): Promise<void> {
    try {
      const url = new URL(photoUrl);
      const path = decodeURIComponent(
        url.pathname
          .replace(/^\/v0\/b\/[^/]+\/o\//, '')
          .replace(/%2F/g, '/')
      );
      const fileRef = ref(this.storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      console.warn('Failed to delete image from storage:', error);
    }
  }
}
