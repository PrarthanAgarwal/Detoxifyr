import { VideoMetadata } from '../types';
import { Video } from '../types/youtube.types';
import { VideoDetails } from '../types/youtube';
import { parseISO8601Duration } from './timeUtils';

export function convertToVideoDetails(video: Video): VideoDetails {
    return {
        id: video.id,
        title: video.snippet.title || '',
        description: video.snippet.description || '',
        publishedAt: video.snippet.publishedAt || new Date().toISOString(),
        thumbnails: {
            default: video.snippet.thumbnails.default || { url: '', width: 120, height: 90 },
            medium: video.snippet.thumbnails.medium || { url: '', width: 320, height: 180 },
            high: video.snippet.thumbnails.high || { url: '', width: 480, height: 360 },
            maxres: video.snippet.thumbnails.maxres
        },
        channelId: video.snippet.channelId || '',
        channelTitle: video.snippet.channelTitle || '',
        duration: video.contentDetails?.duration || 'PT0S',
        viewCount: parseInt(video.statistics?.viewCount || '0', 10),
        likeCount: parseInt(video.statistics?.likeCount || '0', 10),
        commentCount: parseInt(video.statistics?.commentCount || '0', 10),
        defaultLanguage: video.snippet.defaultLanguage,
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        hasCaptions: video.contentDetails?.caption === 'true',
        contentDetails: {
            audioQuality: video.contentDetails?.audioQuality
        },
        regionRestriction: video.contentDetails?.regionRestriction
    };
}

export function convertToVideoMetadata(video: VideoDetails): VideoMetadata {
    return {
        videoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnails.high?.url || video.thumbnails.medium?.url || video.thumbnails.default?.url || '',
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        publishDate: video.publishedAt,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        dislikeCount: 0, // YouTube API no longer provides dislike counts
        commentCount: video.commentCount,
        duration: parseISO8601Duration(video.duration),
        creatorAuthorityScore: 0, // These scores should be calculated by the FilteringEngine
        contentQualityScore: 0,
        engagementRatio: calculateEngagementRatio(video)
    };
}

function calculateEngagementRatio(video: VideoDetails): number {
    const views = video.viewCount || 0;
    if (views === 0) return 0;

    const interactions = (video.likeCount || 0) + (video.commentCount || 0);
    return interactions / views;
} 