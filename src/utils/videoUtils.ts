import { VideoMetadata } from '../types';
import { Video } from '../types/youtube.types';
import { 
    VideoDetails as YouTubeVideoDetails, 
    ChannelInfo as YouTubeChannelInfo,
    VideoContentDetails,
    VideoStatistics,
    ChannelStatistics
} from '../types/youtube';
import { VideoDetails as QualityVideoDetails, ChannelInfo as QualityChannelInfo } from '../types/quality';
import { parseISO8601Duration } from './timeUtils';

export function convertToVideoDetails(video: Video): YouTubeVideoDetails {
    const contentDetails: VideoContentDetails = {
        duration: video.contentDetails?.duration || 'PT0S',
        dimension: video.contentDetails?.dimension || 'hd',
        definition: video.contentDetails?.definition || 'hd',
        caption: video.contentDetails?.caption === 'true',
        licensedContent: video.contentDetails?.licensedContent || false,
        projection: 'rectangular'
    };

    const statistics: VideoStatistics = {
        viewCount: parseInt(video.statistics?.viewCount || '0', 10),
        likeCount: parseInt(video.statistics?.likeCount || '0', 10),
        commentCount: parseInt(video.statistics?.commentCount || '0', 10)
    };

    return {
        id: video.id,
        title: video.snippet.title || '',
        description: video.snippet.description || '',
        publishedAt: new Date(video.snippet.publishedAt || new Date()),
        thumbnails: {
            default: video.snippet.thumbnails.default || { url: '', width: 120, height: 90 },
            medium: video.snippet.thumbnails.medium || { url: '', width: 320, height: 180 },
            high: video.snippet.thumbnails.high || { url: '', width: 480, height: 360 },
            maxres: video.snippet.thumbnails.maxres
        },
        channelId: video.snippet.channelId || '',
        channelTitle: video.snippet.channelTitle || '',
        tags: video.snippet.tags || [],
        statistics,
        contentDetails,
        defaultLanguage: video.snippet.defaultLanguage,
        hasCaptions: video.contentDetails?.caption === 'true'
    };
}

export function convertToVideoMetadata(video: YouTubeVideoDetails): VideoMetadata {
    return {
        videoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnails.high?.url || video.thumbnails.medium?.url || video.thumbnails.default?.url || '',
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        publishDate: video.publishedAt.toISOString(),
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        dislikeCount: 0, // YouTube API no longer provides dislike counts
        commentCount: video.statistics.commentCount,
        duration: parseISO8601Duration(video.contentDetails.duration),
        creatorAuthorityScore: 0, // These scores should be calculated by the FilteringEngine
        contentQualityScore: 0,
        engagementRatio: calculateEngagementRatio(video)
    };
}

function calculateEngagementRatio(video: YouTubeVideoDetails): number {
    const views = video.statistics.viewCount || 0;
    if (views === 0) return 0;

    const interactions = (video.statistics.likeCount || 0) + (video.statistics.commentCount || 0);
    return interactions / views;
}

export function convertQualityToYouTubeVideoDetails(video: QualityVideoDetails): YouTubeVideoDetails {
    const contentDetails: VideoContentDetails = {
        duration: video.duration,
        dimension: 'hd',
        definition: 'hd',
        caption: video.hasCaptions,
        licensedContent: true,
        projection: 'rectangular'
    };

    const statistics: VideoStatistics = {
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount
    };

    const publishedAt = new Date(video.publishedAt);
    if (isNaN(publishedAt.getTime())) {
        publishedAt.setTime(Date.now());
    }

    return {
        id: video.id,
        title: video.title,
        description: video.description || '',
        publishedAt,
        thumbnails: video.thumbnails || {
            default: { url: '', width: 120, height: 90 },
            medium: { url: '', width: 320, height: 180 },
            high: { url: '', width: 480, height: 360 }
        },
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        tags: video.tags || [],
        statistics,
        contentDetails,
        defaultLanguage: video.defaultLanguage,
        hasCaptions: video.hasCaptions
    };
}

export function convertQualityToYouTubeChannelInfo(channel: QualityChannelInfo): YouTubeChannelInfo {
    const statistics: ChannelStatistics = {
        viewCount: channel.totalViews,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount
    };

    const publishedAt = new Date(channel.createdAt || new Date());
    if (isNaN(publishedAt.getTime())) {
        publishedAt.setTime(Date.now());
    }

    return {
        id: channel.id,
        title: channel.title,
        description: channel.description,
        thumbnails: channel.thumbnails,
        statistics,
        publishedAt,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        totalViews: channel.totalViews,
        createdAt: channel.createdAt,
        recentUploads: channel.recentUploads
    };
}

export function convertChannelMap(
    channelMap: Map<string, QualityChannelInfo>
): Map<string, YouTubeChannelInfo> {
    const convertedMap = new Map<string, YouTubeChannelInfo>();
    channelMap.forEach((channel, key) => {
        convertedMap.set(key, convertQualityToYouTubeChannelInfo(channel));
    });
    return convertedMap;
} 