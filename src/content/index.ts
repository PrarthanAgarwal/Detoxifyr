let player: any;
let interval: ReturnType<typeof setInterval>;

// Initialize YouTube player API
function initializeYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
}

// Setup player controls
function setupPlayer() {
  const video = document.querySelector('video');
  if (!video) return;

  player = {
    getCurrentTime: () => video.currentTime,
    getDuration: () => video.duration,
    setPlaybackRate: (rate: number) => {
      video.playbackRate = rate;
    },
  };

  // Start progress tracking
  interval = setInterval(trackProgress, 1000);
}

// Track video progress
function trackProgress() {
  if (!player) return;

  const progress = {
    videoId: new URL(window.location.href).searchParams.get('v'),
    currentTime: player.getCurrentTime(),
    duration: player.getDuration(),
    speed: player.getPlaybackRate(),
  };

  chrome.runtime.sendMessage({
    type: 'UPDATE_PROGRESS',
    payload: progress,
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message: any) => {
  switch (message.type) {
    case 'VIDEO_LOADED':
      setupPlayer();
      break;
    case 'SET_PLAYBACK_SPEED':
      if (player) {
        player.setPlaybackRate(message.payload.speed);
      }
      break;
  }
  return true;
});

// Initialize
initializeYouTubeAPI();
window.addEventListener('yt-navigate-finish', setupPlayer);

// Cleanup
window.addEventListener('unload', () => {
  clearInterval(interval);
});