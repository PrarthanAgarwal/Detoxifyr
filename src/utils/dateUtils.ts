export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const [, hours, minutes, seconds] = match;
  return (
    (parseInt(hours || '0', 10) * 3600) +
    (parseInt(minutes || '0', 10) * 60) +
    parseInt(seconds || '0', 10)
  );
} 