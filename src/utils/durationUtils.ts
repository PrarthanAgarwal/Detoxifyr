/**
 * Utility functions for handling video duration conversions
 */

/**
 * Converts a YouTube duration string (ISO 8601) to seconds
 * Example: "PT1H2M10S" -> 3730 (1h 2m 10s = 3730 seconds)
 */
export function convertDurationToSeconds(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const [, hours, minutes, seconds] = match;
    return (
        (parseInt(hours || '0') * 3600) +
        (parseInt(minutes || '0') * 60) +
        parseInt(seconds || '0')
    );
}

/**
 * Converts seconds to a human-readable duration string
 * Example: 3730 -> "1:02:10"
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 