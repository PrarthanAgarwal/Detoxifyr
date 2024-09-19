console.log("Content script is running on YouTube!");

let currentVideoCount = 0;
let totalVideoCount = 0;
let playbackSpeed = 1;
let searchKeyword = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startDetox") {
    const { keyword, speed, videoCount } = request;
    console.log('Starting detox with keyword:', keyword, 'speed:', speed, 'videoCount:', videoCount);
    searchKeyword = keyword;
    playbackSpeed = speed;
    totalVideoCount = videoCount;
    currentVideoCount = 0;
    searchAndWatchVideos();
  }
});

function searchAndWatchVideos() {
  if (currentVideoCount >= totalVideoCount) {
    console.log("Detox completed.");
    chrome.runtime.sendMessage({ 
      action: "updateTaskStatus", 
      completedVideos: currentVideoCount 
    });
    return;
  }

  if (window.location.href.includes("/results?search_query=")) {
    setTimeout(() => {
      const videos = document.querySelectorAll('ytd-video-renderer a#video-title');
      if (videos.length > currentVideoCount) {
        videos[currentVideoCount].click();
        currentVideoCount++;
        chrome.runtime.sendMessage({ 
          action: "updateTaskStatus", 
          completedVideos: currentVideoCount 
        });
        setTimeout(watchVideo, 1000);
      } else {
        console.log("No more videos found.");
      }
    }, 1000);
  } else {
    const searchBox = document.querySelector('input#search');
    if (searchBox) {
      searchBox.value = searchKeyword;
      const searchButton = document.querySelector('button#search-icon-legacy');
      searchButton.click();
      setTimeout(searchAndWatchVideos, 1000);
    }
  }
}

function watchVideo() {
  const video = document.querySelector('video');
  if (video) {
    video.playbackRate = playbackSpeed;
    
    // Watch for 2 minutes
    setTimeout(() => {
      console.log(`Watched video ${currentVideoCount} of ${totalVideoCount}`);
      window.history.back();
      setTimeout(searchAndWatchVideos, 3000);
    }, 120000);
  } else {
    console.log("Video element not found.");
    setTimeout(searchAndWatchVideos, 3000);
  }
}