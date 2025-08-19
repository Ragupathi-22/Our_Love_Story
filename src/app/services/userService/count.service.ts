import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection } from '@angular/fire/firestore';
import { query as fsQuery, getAggregateFromServer, count } from 'firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class CountService {
  constructor(private firestore: Firestore,  private auth: Auth) {}


  getUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async getTimelineCount(): Promise<number> {
    const uid = this.getUid();
    if (!uid) return 0;
    const timelineRef = collection(this.firestore, `users/${uid}/timeline`);
    const aggregation = await getAggregateFromServer(fsQuery(timelineRef), { count: count() });
    return aggregation.data().count;
  }

  async getGalleryCount(): Promise<number> {
    const uid = this.getUid();
    if (!uid) return 0;
    const galleryRef = collection(this.firestore, `users/${uid}/gallery`);
    const aggregation = await getAggregateFromServer(fsQuery(galleryRef), { count: count() });
    return aggregation.data().count;
  }

  async getPlaylistsCount(): Promise<number> {
    const uid = this.getUid();
    if (!uid) return 0;
    const playlistsRef = collection(this.firestore, `users/${uid}/playlists`);
    const aggregation = await getAggregateFromServer(fsQuery(playlistsRef), { count: count() });
    return aggregation.data().count;
  }
}
