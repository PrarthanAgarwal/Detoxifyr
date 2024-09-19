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

  // If we're on the search page, click a video
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
        setTimeout(watchVideo, 1000); // Wait for video page to load
      } else {
        console.log("No more videos found.");
      }
    }, 1000); // Wait for search results to load
  } else {
    // If we're not on the search page, perform the search
    const searchBox = document.querySelector('input#search');
    if (searchBox) {
      searchBox.value = searchKeyword;
      const searchButton = document.querySelector('button#search-icon-legacy');
      searchButton.click();
      setTimeout(searchAndWatchVideos, 1000); // Wait for search results to load
    }
  }
}

function watchVideo() {
  const video = document.querySelector('video');
  if (video) {
    video.playbackRate = playbackSpeed;
    
    // Watch for 2 minutes (adjust as needed)
    setTimeout(() => {
      console.log(`Watched video ${currentVideoCount} of ${totalVideoCount}`);
      // Go back to search results
      window.history.back();
      // Wait for page to load, then search for next video
      setTimeout(searchAndWatchVideos, 3000);
    }, 120000); // 2 minutes
  } else {
    console.log("Video element not found.");
    setTimeout(searchAndWatchVideos, 3000);
  }
}