let currentTask = null;
let taskHistory = [];

function saveState() {
  chrome.storage.local.set({ currentTask, taskHistory });
}

function loadState(callback) {
  chrome.storage.local.get(['currentTask', 'taskHistory'], (result) => {
    currentTask = result.currentTask || null;
    taskHistory = result.taskHistory || [];
    if (callback) callback();
  });
}


function showNotification(title, message) {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: title,
      message: message
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("Error creating notification:", chrome.runtime.lastError.message);
      }
    });
  } else {
    console.log("Notifications not available:", title, "-", message);
  }
}

function updateTaskStatus(request, sendResponse) {
  if (currentTask) {
    currentTask.completedVideos = Math.min(request.completedVideos, currentTask.videoCount);
    if (request.status === "completed" || currentTask.completedVideos >= currentTask.videoCount) {
      currentTask.status = "completed";
      currentTask.endTime = new Date().toISOString();
      currentTask.completedVideos = currentTask.videoCount; // Ensure we don't exceed the total
      chrome.action.setBadgeText({ text: "✓" });
      showNotification("YouTube Detoxifier", "Task completed successfully!");
    }
    const index = taskHistory.findIndex(task => task.id === currentTask.id);
    if (index !== -1) {
      taskHistory[index] = currentTask;
    }
    saveState();
  }
  sendResponse({status: "updated"});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startDetox") {
    currentTask = {
      id: Date.now(),
      keyword: request.keyword,
      speed: request.speed,
      videoCount: request.videoCount,
      startTime: new Date().toISOString(),
      completedVideos: 0,
      status: "running"
    };
    taskHistory.push(currentTask);
    saveState();
    chrome.action.setBadgeText({ text: "▶" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    sendResponse({status: "started"});
  } 
  else if (request.action === "updateTaskStatus") {
    updateTaskStatus(request, sendResponse);
    return true;
  } 
  else if (request.action === "terminateTask") {
    if (currentTask) {
      currentTask.status = "terminated";
      currentTask.endTime = new Date().toISOString();
      const index = taskHistory.findIndex(task => task.id === currentTask.id);
      if (index !== -1) {
        taskHistory[index] = currentTask;
      }
      chrome.action.setBadgeText({ text: "" });
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "terminateDetox"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error('Error:', chrome.runtime.lastError);
            } else {
              console.log('Response:', response);
            }
          });
        }
      });
      saveState();
      sendResponse({status: "terminated"});
    } else {
      sendResponse({status: "no active task"});
    }
  } 
  else if (request.action === "getTaskStatus") {
    loadState(() => {
      sendResponse({ currentTask, taskHistory });
    });
    return true; // Indicates that the response will be sent asynchronously
  }
  else if (request.action === "resetTask") {
    if (currentTask && currentTask.status === "completed") {
      currentTask = null;
      saveState();
      sendResponse({status: "reset"});
    } else {
      sendResponse({status: "no completed task to reset"});
    }
  }
  return true; // Indicates that the response will be sent asynchronously
});

chrome.runtime.onInstalled.addListener(() => {
  loadState();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(tabId, { action: "checkAndContinueDetox" }, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
      } else {
        console.log(response);
      }
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggleDetox" });
  } else {
    showNotification("YouTube Detoxifier", "Please navigate to YouTube to use this extension.");
  }
});