export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  keywords: string[];
  playbackSpeed: number;
  maxVideos: number;
  videosWatched: VideoProgress[];
  isActive: boolean;
}

export interface VideoProgress {
  videoId: string;
  title: string;
  thumbnail: string;
  progress: number;
  startTime: number;
  endTime?: number;
  speed: number;
}

export interface SessionSettings {
  keywords: string[];
  playbackSpeed: number;
  maxVideos: number;
  maxDuration: number;
  autoplay: boolean;
  notifications: boolean;
}

export interface SessionStats {
  totalTime: number;
  videosWatched: number;
  averageSpeed: number;
  favoriteKeywords: string[];
}