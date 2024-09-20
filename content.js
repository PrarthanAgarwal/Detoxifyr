console.log("Content script is running on YouTube!");

let currentVideoCount = 0;
let totalVideoCount = 0;
let playbackSpeed = 1;
let searchKeyword = '';
let observer;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startDetox") {
    const { keyword, speed, videoCount } = request;
    console.log('Starting detox with keyword:', keyword, 'speed:', speed, 'videoCount:', videoCount);
    searchKeyword = keyword;
    playbackSpeed = speed;
    totalVideoCount = videoCount;
    currentVideoCount = 0;
    
    // Respond immediately
    sendResponse({status: "started"});
    
    // Start the process asynchronously
    setTimeout(searchAndWatchVideos, 0);
  }
  return true;
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

  performSearch();
}

function performSearch() {
  console.log("Performing search for:", searchKeyword);
  
  // Use the YouTube search API directly
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchKeyword)}`;
  
  // Navigate to the search results page
  window.location.href = searchUrl;

  // Wait for the navigation to complete before proceeding
  waitForNavigation(() => {
    console.log("Search results page loaded");
    waitForElement('ytd-video-renderer a#video-title', clickVideoResult);
  });
}

function clickVideoResult() {
  const videos = document.querySelectorAll('ytd-video-renderer a#video-title');
  if (videos.length > currentVideoCount) {
    videos[currentVideoCount].click();
    currentVideoCount++;
    chrome.runtime.sendMessage({ 
      action: "updateTaskStatus", 
      completedVideos: currentVideoCount 
    });
    waitForNavigation(watchVideo);
  } else {
    console.log("No more videos found.");
    retryOperation(searchAndWatchVideos);
  }
}

function watchVideo() {
  waitForElement('video', (video) => {
    video.playbackRate = playbackSpeed;
    
    // Watch for 2 minutes
    setTimeout(() => {
      console.log(`Watched video ${currentVideoCount} of ${totalVideoCount}`);
      window.history.back();
      waitForNavigation(searchAndWatchVideos);
    }, 120000);
  });
}

function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        callback(element);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

function waitForNavigation(callback) {
  if (observer) {
    observer.disconnect();
  }
  observer = new MutationObserver((mutations, obs) => {
    if (document.readyState === 'complete') {
      obs.disconnect();
      callback();
    }
  });
  observer.observe(document, {attributes: false, childList: true, characterData: false, subtree: true});
}

function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let retries = 0;
  const retry = () => {
    if (retries < maxRetries) {
      retries++;
      console.log(`Retrying operation (attempt ${retries})`);
      setTimeout(operation, delay);
    } else {
      console.error(`Operation failed after ${maxRetries} attempts`);
    }
  };
  retry();
}