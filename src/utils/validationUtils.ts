import { ChannelInfo, VideoDetails } from "@/types/youtube";

export const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
export const YOUTUBE_CHANNEL_ID_REGEX = /^UC[a-zA-Z0-9_-]{22}$/;

export function isValidVideoId(videoId: string | undefined | null): boolean {
    if (!videoId) return false;
    return YOUTUBE_VIDEO_ID_REGEX.test(videoId);
}

export function isValidChannelId(channelId: string | undefined | null): boolean {
    if (!channelId) return false;
    return YOUTUBE_CHANNEL_ID_REGEX.test(channelId);
}

export interface ValidationResult<T> {
    isValid: boolean;
    data?: T;
    errors: string[];
}

export function validateVideoDetails(video: any): ValidationResult<VideoDetails> {
    const errors: string[] = [];
    
    if (!isValidVideoId(video?.id)) {
        errors.push('Invalid video ID');
    }
    
    if (!isValidChannelId(video?.snippet?.channelId)) {
        errors.push('Invalid channel ID');
    }
    
    if (!video?.snippet?.title) {
        errors.push('Missing video title');
    }
    
    if (!video?.snippet?.publishedAt || isNaN(Date.parse(video.snippet.publishedAt))) {
        errors.push('Invalid publish date');
    }
    
    return {
        isValid: errors.length === 0,
        data: video as VideoDetails,
        errors
    };
}

export function validateChannelInfo(channel: any): ValidationResult<ChannelInfo> {
    const errors: string[] = [];
    
    if (!isValidChannelId(channel?.id)) {
        errors.push('Invalid channel ID');
    }
    
    if (!channel?.snippet?.title) {
        errors.push('Missing channel title');
    }
    
    if (!channel?.snippet?.publishedAt || isNaN(Date.parse(channel.snippet.publishedAt))) {
        errors.push('Invalid channel creation date');
    }
    
    return {
        isValid: errors.length === 0,
        data: channel as ChannelInfo,
        errors
    };
} 