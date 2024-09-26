let watchTimer = null;

let detoxState = {
  currentVideoCount: 0,
  totalVideoCount: 0,
  playbackSpeed: 1,
  searchKeyword: '',
  isDetoxActive: false
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "startDetox") {
    const { keyword, speed, videoCount } = request;
    console.log('Starting detox with keyword:', keyword, 'speed:', speed, 'videoCount:', videoCount);
    detoxState = {
      searchKeyword: keyword,
      playbackSpeed: speed,
      totalVideoCount: videoCount,
      currentVideoCount: 0,
      isDetoxActive: true
    };
    
    setTimeout(() => {
      searchAndWatchVideos();
      sendResponse({status: "started"});
    }, 0);
    
    return true;
  } else if (request.action === "checkAndContinueDetox") {
    if (detoxState.isDetoxActive) {
      setTimeout(searchAndWatchVideos, 0);
    }
    sendResponse({status: "checked"});
  } else if (request.action === "terminateDetox") {
    detoxState.isDetoxActive = false;
    if (watchTimer) {
      clearTimeout(watchTimer);
    }
    sendResponse({status: "terminated"});
  }
  return true;
});

function searchAndWatchVideos() {
  if (!detoxState.isDetoxActive || detoxState.currentVideoCount >= detoxState.totalVideoCount) {
    console.log("Detox completed or terminated.");
    updateTaskStatus("completed");
    return;
  }

  if (window.location.pathname === "/results") {
    console.log("On search results page, clicking video");
    clickVideoResult();
  } else if (window.location.pathname === "/watch") {
    console.log("On video page, watching video");
    watchVideo();
  } else {
    console.log("Not on results or watch page, performing search");
    performSearch();
  }
}

function performSearch() {
  console.log("Performing search for:", detoxState.searchKeyword);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(detoxState.searchKeyword)}`;
  window.location.href = searchUrl;
}

function clickVideoResult() {
  console.log("Attempting to click video result");
  waitForElement('ytd-video-renderer a#video-title', (videos) => {
    if (videos.length > detoxState.currentVideoCount) {
      console.log(`Clicking video ${detoxState.currentVideoCount + 1}`);
      videos[detoxState.currentVideoCount].click();
    } else {
      console.log("No more videos found. Retrying search.");
      retryOperation(performSearch);
    }
  });
}

function watchVideo() {
  waitForElement('video', (videoElements) => {
    if (videoElements.length === 0) {
      console.log("Video element not found. Retrying...");
      setTimeout(watchVideo, 3000);
      return;
    }
    
    const video = videoElements[0];
    console.log(`Starting to watch video ${detoxState.currentVideoCount + 1} of ${detoxState.totalVideoCount}`);
    
    const setAndMaintainPlaybackSpeed = () => {
      if (video.playbackRate !== detoxState.playbackSpeed) {
        console.log(`Setting playback speed to ${detoxState.playbackSpeed}`);
        video.playbackRate = detoxState.playbackSpeed;
      }
    };

    setAndMaintainPlaybackSpeed();

    const playVideo = () => {
      if (video.paused) {
        video.play().then(() => {
          console.log("Video started playing successfully");
        }).catch(error => {
          console.error('Error playing video:', error);
          const playButton = document.querySelector('.ytp-play-button');
          if (playButton) {
            console.log("Attempting to click play button");
            playButton.click();
            setTimeout(playVideo, 1000); // Retry after 1 second
          } else {
            console.error("Play button not found");
          }
        });
      }
    };

    playVideo();
    
    const speedInterval = setInterval(setAndMaintainPlaybackSpeed, 1000);
    
    const handleVideoEnd = () => {
      console.log(`Finished watching video ${detoxState.currentVideoCount + 1} of ${detoxState.totalVideoCount}`);
      clearInterval(speedInterval);
      video.removeEventListener('ended', handleVideoEnd);
      detoxState.currentVideoCount++;
      updateTaskStatus("running");
      if (detoxState.currentVideoCount < detoxState.totalVideoCount) {
        console.log("Moving to next video");
        window.history.back();
        setTimeout(searchAndWatchVideos, 2000); // Add a delay before searching for the next video
      } else {
        console.log("All videos watched, ending detox");
        detoxState.isDetoxActive = false;
        updateTaskStatus("completed");
      }
    };

    video.addEventListener('ended', handleVideoEnd);
    
    // Set a maximum watch time of 2 minutes
    watchTimer = setTimeout(() => {
      console.log("Maximum watch time reached, moving to next video");
      video.removeEventListener('ended', handleVideoEnd);
      handleVideoEnd();
    }, 120000);
  });
}

function updateTaskStatus(status) {
  chrome.runtime.sendMessage({ 
    action: "updateTaskStatus", 
    completedVideos: detoxState.currentVideoCount,
    status: status
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error updating task status:", chrome.runtime.lastError);
    } else {
      console.log("Task status updated successfully:", response);
    }
  });
}

function waitForElement(selector, callback) {
  const element = document.querySelectorAll(selector);
  if (element.length > 0) {
    callback(element);
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelectorAll(selector);
      if (element.length > 0) {
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

// Initial check when the script loads
chrome.runtime.sendMessage({ action: "getTaskStatus" }, (response) => {
  if (chrome.runtime.lastError) {
    console.error("Error getting task status:", chrome.runtime.lastError);
  } else if (response && response.currentTask && response.currentTask.status === "running") {
    console.log("Resuming active detox task");
    detoxState = {
      searchKeyword: response.currentTask.keyword,
      playbackSpeed: response.currentTask.speed,
      totalVideoCount: response.currentTask.videoCount,
      currentVideoCount: response.currentTask.completedVideos,
      isDetoxActive: true
    };
    searchAndWatchVideos();
  }
});