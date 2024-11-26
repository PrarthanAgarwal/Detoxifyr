import { Session, VideoProgress } from '@/types/session';

chrome.runtime.onInstalled.addListener(() => {
  // Initialize extension settings
  chrome.storage.sync.set({
    settings: {
      keywords: [],
      playbackSpeed: 1,
      maxVideos: 5,
      autoplay: true,
      notifications: true,
    },
  });
});

// Listen for YouTube navigation
chrome.webNavigation.onCompleted.addListener(
  async ({ tabId, url }) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      if (!videoId) return;

      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/index.ts'],
      });

      // Send video info to content script
      chrome.tabs.sendMessage(tabId, {
        type: 'VIDEO_LOADED',
        payload: { videoId },
      });
    }
  },
  { url: [{ hostEquals: 'www.youtube.com' }] }
);

// Handle messages from content script
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'UPDATE_PROGRESS':
      handleProgressUpdate(message.payload);
      break;
    case 'SESSION_COMPLETE':
      handleSessionComplete(message.payload);
      break;
  }
  return true;
});

async function handleProgressUpdate(progress: VideoProgress) {
  const { currentSession } = await chrome.storage.local.get('currentSession');
  if (currentSession) {
    const updatedSession = {
      ...currentSession,
      videosWatched: currentSession.videosWatched.map((v: VideoProgress) =>
        v.videoId === progress.videoId ? progress : v
      ),
    };
    await chrome.storage.local.set({ currentSession: updatedSession });
  }
}

async function handleSessionComplete(session: Session) {
  await chrome.storage.local.set({ currentSession: null });
  const { history = [] } = await chrome.storage.local.get('history');
  await chrome.storage.local.set({
    history: [...history, { ...session, endTime: Date.now() }],
  });
}