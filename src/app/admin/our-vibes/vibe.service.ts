// app/our-vibes/vibe.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  collectionData
} from '@angular/fire/firestore';
import { PlaylistItem } from '../../models/user-profile.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class VibeService {
  constructor(private firestore: Firestore) {}

  async savePlaylist(
    uid: string,
    playlist: PlaylistItem,
    editingId: string | null
  ): Promise<PlaylistItem[]> {
    const playlistsRef = collection(this.firestore, `users/${uid}/playlists`);

    const id = editingId || uuidv4();
    const playlistDocRef = doc(this.firestore, `users/${uid}/playlists/${id}`);

    await setDoc(playlistDocRef, {
      id,
      playlistUrl: playlist.playlistUrl,
      playlistName: playlist.playlistName
    });

    return this.getPlaylists(uid);
  }

  async deletePlaylist(uid: string, id: string): Promise<PlaylistItem[]> {
    const playlistDocRef = doc(this.firestore, `users/${uid}/playlists/${id}`);
    await deleteDoc(playlistDocRef);
    return this.getPlaylists(uid);
  }

  async getPlaylists(uid: string): Promise<PlaylistItem[]> {
    const playlistsRef = collection(this.firestore, `users/${uid}/playlists`);
    const snapshot = await getDocs(playlistsRef);
    return snapshot.docs.map(doc => doc.data() as PlaylistItem);
  }
}
