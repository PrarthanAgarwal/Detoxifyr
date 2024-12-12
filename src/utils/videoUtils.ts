import { VideoDetails } from '../types/youtube';
import { YouTubeVideo } from '../types/youtube.types';

export function convertToVideoDetails(video: YouTubeVideo): VideoDetails {
  return {
    id: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    publishedAt: video.snippet.publishedAt,
    thumbnails: video.snippet.thumbnails,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    viewCount: parseInt(video.statistics?.viewCount || '0', 10),
    likeCount: parseInt(video.statistics?.likeCount || '0', 10),
    commentCount: parseInt(video.statistics?.commentCount || '0', 10),
    duration: video.contentDetails?.duration || 'PT0S'
  };
}

export function convertToVideoMetadata(video: VideoDetails) {
  return {
    videoId: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnails.high.url,
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    publishDate: video.publishedAt,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    dislikeCount: 0, // This might need to be fetched separately
    commentCount: video.commentCount,
    duration: 0, // This needs to be calculated from the video duration
    creatorAuthorityScore: 0,
    contentQualityScore: 0,
    engagementRatio: 0
  };
} 