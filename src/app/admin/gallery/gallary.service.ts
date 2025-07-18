import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
import { GalleryItem } from '../../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  constructor(private firestore: Firestore, private storage: Storage) {}

  // async uploadImage(uid: string, file: File): Promise<string> {
  //   const compressedFile = await imageCompression(file, {
  //     maxSizeMB: 0.5,
  //     maxWidthOrHeight: 1024,
  //     useWebWorker: true
  //   });

  //   const fileName = `${uuidv4()}_${compressedFile.name}`;
  //   const filePath = `users/${uid}/gallery/images/${fileName}`;
  //   const storageRef = ref(this.storage, filePath);

  //   await uploadBytes(storageRef, compressedFile);
  //   return await getDownloadURL(storageRef);
  // }
async uploadImage(uid: string, file: File): Promise<string> {
  let fileToUpload = file;

  // If file size > 5MB (5 * 1024 * 1024), compress it slightly
  if (file.size > 5 * 1024 * 1024) {
    fileToUpload = await imageCompression(file, {
      maxSizeMB: 5, // Target a file around 5MB
      maxWidthOrHeight: 1920, // High resolution (reduce only if very large)
      initialQuality: 0.9, // High quality
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
    formData: { title: string ,date: string},
    photoUrl: string,
    editingId: string | null,
    previousPhotoUrl: string
  ): Promise<GalleryItem[]> {
    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    const userData = snapshot.data();
    const photoDate = new Date(formData.date);
    if (!userData) return [];

    const gallery: GalleryItem[] = [...(userData['gallery'] || [])];

    if (editingId) {
      const index = gallery.findIndex(item => item.id === editingId);
      if (index !== -1) {
        // Delete old photo if new uploaded
        if (photoUrl !== previousPhotoUrl && previousPhotoUrl) {
          await this.deleteImageFromStorage(previousPhotoUrl);
        }

        gallery[index] = {
          ...gallery[index],
          ...formData,
           date: formData.date,
          photoUrl
        };
      }
    } else {
      gallery.push({
        id: uuidv4(),
        title: formData.title,
        date: formData.date,
        photoUrl
      });
    }

    await updateDoc(userRef, { gallery });
    return gallery;
  }

  async deleteGalleryItem(uid: string, id: string): Promise<GalleryItem[]> {
    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    const userData = snapshot.data();
    if (!userData) return [];

    const gallery: GalleryItem[] = [...(userData['gallery'] || [])];
    const item = gallery.find(i => i.id === id);

    // Delete image from Firebase Storage
    if (item?.photoUrl) {
      await this.deleteImageFromStorage(item.photoUrl);
    }

    const updatedGallery = gallery.filter(i => i.id !== id);
    await updateDoc(userRef, { gallery: updatedGallery });
    return updatedGallery;
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
