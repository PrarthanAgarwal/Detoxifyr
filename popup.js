document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start');
  const inputForm = document.getElementById('inputForm');
  const taskStatus = document.getElementById('taskStatus');
  const viewDetails = document.getElementById('viewDetails');
  const progressBar = document.getElementById('progressBar');
  const statusMessage = document.getElementById('statusMessage');

  let statusUpdateInterval;

  // Fetch and display current task status on popup open
  updateTaskStatus();

  // Set up periodic status updates
  startStatusUpdates();

  startButton.addEventListener('click', () => {
    const keyword = document.getElementById('keyword').value.trim();
    const speed = parseFloat(document.getElementById('speed').value);
    const videoCount = parseInt(document.getElementById('videoCount').value);

    if (validateInputs(keyword, speed, videoCount)) {
      startDetoxProcess(keyword, speed, videoCount);
    }
  });

  viewDetails.addEventListener('click', () => {
    chrome.tabs.create({ url: "taskdetails.html" });
  });

 // Use visibilitychange event instead of unload
 document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateTaskStatus();
  }
});
});

function startStatusUpdates() {
  updateTaskStatus();
  statusUpdateInterval = setInterval(updateTaskStatus, 5000);
  }

function stopStatusUpdates() {
  clearInterval(statusUpdateInterval);
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
                keyword, 
                speed, 
                videoCount 
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
  inputForm.style.display = "none";
  taskStatus.style.display = "block";
}

function updateTaskStatus() {
  chrome.runtime.sendMessage({ action: "getTaskStatus" }, (response) => {
    if (response.currentTask) {
      const { completedVideos, videoCount, status } = response.currentTask;
      const progress = (completedVideos / videoCount) * 100;
      
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${Math.round(progress)}%`;
      
      statusMessage.textContent = `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      statusMessage.className = `status-${status}`;

      showTaskStatus();

      if (status === "completed") {
        showCompletionMessage();
      }
    } else {
      taskStatus.style.display = "none";
      inputForm.style.display = "block";
    }
  });
}

function showCompletionMessage() {
  const completionMessage = document.createElement('div');
  completionMessage.textContent = "Detox process completed!";
  completionMessage.className = "completion-message";
  taskStatus.appendChild(completionMessage);
  
  setTimeout(() => {
    completionMessage.remove();
    taskStatus.style.display = "none";
    inputForm.style.display = "block";
  }, 5000);
}