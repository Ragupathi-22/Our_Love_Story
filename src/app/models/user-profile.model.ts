export interface PlaylistItem {
  id: string;
  playlistUrl: string;
  playlistName: string;
}

export interface TimelineItem {
  id:string;
  date: string;
  title: string;
  photoUrl: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  photoUrl: string;
}
export interface ReminderItem {
  id: string;
  title: string;
  date: string;
}

export interface PeriodItem {
  id: string;
  startDate: string;
  endDate: string;
}

export interface UserProfile {
  uid: string;
  yourName: string;
  partnerName: string;
  yourDob: string;
  partnerDob: string;
  loveStartDate: string;
  email: string;
  playlists: PlaylistItem[];
  timeline: TimelineItem[];
  gallery: GalleryItem[];
  reminders: ReminderItem[];
  periods: PeriodItem[];
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}
