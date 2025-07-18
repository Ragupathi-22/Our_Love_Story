// app/our-vibes/vibe.service.ts
import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
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
    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    const data = snapshot.data();
    if (!data) return [];

    let playlistArray: PlaylistItem[] = [...(data['playlists'] || [])];

    if (editingId) {
      const index = playlistArray.findIndex(p => p.id === editingId);
      if (index !== -1) {
        playlistArray[index] = {
          id: editingId,
          playlistUrl: playlist.playlistUrl,
          playlistName: playlist.playlistName
        };
      }
    } else {
      playlistArray.push({
        id: uuidv4(),
        playlistUrl: playlist.playlistUrl,
        playlistName: playlist.playlistName
      });
    }

    await updateDoc(userRef, { playlists: playlistArray });
    return playlistArray;
  }

  async deletePlaylist(uid: string, id: string): Promise<PlaylistItem[]> {
    const userRef = doc(this.firestore, 'users', uid);
    const snapshot = await getDoc(userRef);
    const data = snapshot.data();
    if (!data) return [];

    const playlistArray: PlaylistItem[] = [...(data['playlists'] || [])];
    const updated = playlistArray.filter(p => p.id !== id);
    await updateDoc(userRef, { playlists: updated });
    return updated;
  }
}
