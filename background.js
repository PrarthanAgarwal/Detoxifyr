let currentTask = null;
let taskHistory = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startDetox") {
    currentTask = {
      id: Date.now(), // Add a unique id for each task
      keyword: request.keyword,
      speed: request.speed,
      videoCount: request.videoCount,
      startTime: new Date().toISOString(),
      completedVideos: 0,
      status: "running"
    };
    taskHistory.push(currentTask);
    chrome.storage.local.set({ currentTask, taskHistory });
    chrome.action.setBadgeText({ text: "▶" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
  } else if (request.action === "updateTaskStatus") {
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
      // Update the task in taskHistory
      const index = taskHistory.findIndex(task => task.id === currentTask.id);
      if (index !== -1) {
        taskHistory[index] = currentTask;
      }
      chrome.storage.local.set({ currentTask, taskHistory });
    }
  } else if (request.action === "terminateTask") {
    if (currentTask) {
      currentTask.status = "terminated";
      currentTask.endTime = new Date().toISOString();
      // Update the task in taskHistory
      const index = taskHistory.findIndex(task => task.id === currentTask.id);
      if (index !== -1) {
        taskHistory[index] = currentTask;
      }
      chrome.action.setBadgeText({ text: "" });
      chrome.storage.local.set({ currentTask: null, taskHistory });
    }
  } else if (request.action === "getTaskStatus") {
    sendResponse({ currentTask, taskHistory });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['taskHistory'], (result) => {
    taskHistory = result.taskHistory || [];
    chrome.storage.local.set({ currentTask: null, taskHistory });
  });
});