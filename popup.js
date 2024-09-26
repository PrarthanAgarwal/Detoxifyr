function sanitizeInput(input) {
  return input.replace(/[&<>"']/g, function (match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
}

let statusUpdateInterval;
let completionMessageShown = false;

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start');
  const inputForm = document.getElementById('inputForm');
  const taskStatus = document.getElementById('taskStatus');
  const viewDetails = document.getElementById('viewDetails');
  const progressBar = document.getElementById('progressBar');
  const statusMessage = document.getElementById('statusMessage');

  // Fetch and display current task status on popup open
  updateTaskStatus();

  // Set up periodic status updates
  startStatusUpdates();

  startButton.addEventListener('click', () => {
    const keyword = sanitizeInput(document.getElementById('keyword').value.trim());
    const speed = parseFloat(sanitizeInput(document.getElementById('speed').value));
    const videoCount = parseInt(sanitizeInput(document.getElementById('videoCount').value));

    if (validateInputs(keyword, speed, videoCount)) {
      startDetoxProcess(keyword, speed, videoCount);
    }
  });

  viewDetails.addEventListener('click', () => {
    chrome.tabs.create({ url: "taskdetails.html" });
    // Reset the interface only when viewing task details
    resetInterface();
  });

  // Use visibilitychange event instead of unload
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopStatusUpdates();
    } else {
      startStatusUpdates();
    }
  });
});

function startStatusUpdates() {
  updateTaskStatus();
  if (!statusUpdateInterval) {
    statusUpdateInterval = setInterval(updateTaskStatus, 5000);
  }
}

function stopStatusUpdates() {
  clearInterval(statusUpdateInterval);
  statusUpdateInterval = null;
}

function validateInputs(keyword, speed, videoCount) {
  let isValid = true;
  let errorMessage = '';

  if (!keyword) {
    isValid = false;
    errorMessage += 'Please enter a keyword. ';
  }

  if (isNaN(speed) || speed <= 0 || speed > 2) {
    isValid = false;
    errorMessage += 'Speed must be a number between 0 and 2. ';
  }

  if (isNaN(videoCount) || videoCount <= 0 || videoCount > 100) {
    isValid = false;
    errorMessage += 'Video count must be a number between 1 and 100. ';
  }

  if (!isValid) {
    showError(errorMessage);
  }

  return isValid;
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function startDetoxProcess(keyword, speed, videoCount) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url.includes("youtube.com")) {
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          showError("Error injecting script: " + chrome.runtime.lastError.message);
        } else {
          chrome.tabs.sendMessage(activeTab.id, { 
            action: "startDetox", 
            keyword, 
            speed, 
            videoCount 
          }, (response) => {
            if (chrome.runtime.lastError) {
              showError("Error starting detox: " + chrome.runtime.lastError.message);
            } else {
              chrome.runtime.sendMessage({ 
                action: "startDetox", 
                keyword: sanitizeInput(keyword), 
                speed: sanitizeInput(speed.toString()), 
                videoCount: sanitizeInput(videoCount.toString()) 
              });
              showTaskStatus();
            }
          });
        }
      });
    } else {
      showError("Please navigate to a YouTube page before starting the detox process.");
    }
  });
}

function showTaskStatus() {
  document.getElementById('inputForm').style.display = "none";
  document.getElementById('taskStatus').style.display = "block";
}

function updateTaskStatus() {
  chrome.runtime.sendMessage({ action: "getTaskStatus" }, (response) => {
    if (response && response.currentTask) {
      const { completedVideos, videoCount, status } = response.currentTask;
      const progress = (completedVideos / videoCount) * 100;
      
      document.getElementById('progressBar').style.width = `${progress}%`;
      document.getElementById('progressBar').textContent = `${Math.round(progress)}%`;
      
      document.getElementById('statusMessage').textContent = `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      document.getElementById('statusMessage').className = `status-${status}`;

      showTaskStatus();

      if (status === "completed" && !completionMessageShown) {
        showCompletionMessage();
        completionMessageShown = true;
      }
    }
    // Removed the else block that was resetting the interface
  });
}

function showCompletionMessage() {
  const completionMessage = document.createElement('div');
  completionMessage.textContent = "Detox process completed!";
  completionMessage.className = "completion-message";
  document.getElementById('taskStatus').appendChild(completionMessage);
}

function resetInterface() {
  document.getElementById('taskStatus').style.display = "none";
  document.getElementById('inputForm').style.display = "block";
  // Clear progress bar and status message
  document.getElementById('progressBar').style.width = "0%";
  document.getElementById('progressBar').textContent = "";
  document.getElementById('statusMessage').textContent = "";
  document.getElementById('statusMessage').className = "";
  completionMessageShown = false;
}