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
    if (currentTask) {
      currentTask.completedVideos = request.completedVideos;
      if (request.completedVideos >= currentTask.videoCount) {
        currentTask.status = "completed";
        currentTask.endTime = new Date().toISOString();
        chrome.action.setBadgeText({ text: "✓" });
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "YouTube Detoxifier",
          message: "Task completed successfully!"
        });
      }
      const index = taskHistory.findIndex(task => task.id === currentTask.id);
      if (index !== -1) {
        taskHistory[index] = currentTask;
      }
      saveState();
    }
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
      currentTask = null;
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
  return true; // Indicates that the response will be sent asynchronously
});

chrome.runtime.onInstalled.addListener(() => {
  loadState();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['taskHistory'], (result) => {
    taskHistory = result.taskHistory || [];
    chrome.storage.local.set({ currentTask: null, taskHistory });
  });
});

// Listen for tab updates to handle navigation events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(tabId, { action: "checkAndContinueDetox" });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggleDetox" });
  } else {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "YouTube Detoxifier",
      message: "Please navigate to YouTube to use this extension."
    });
  }
});