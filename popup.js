document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start');
  const inputForm = document.getElementById('inputForm');
  const taskStatus = document.getElementById('taskStatus');
  const viewDetails = document.getElementById('viewDetails');

  chrome.runtime.sendMessage({ action: "getTaskStatus" }, (response) => {
    if (response.currentTask && response.currentTask.status === "running") {
      inputForm.style.display = "none";
      taskStatus.style.display = "block";
    }
  });

  startButton.addEventListener('click', () => {
    const keyword = document.getElementById('keyword').value;
    const speed = document.getElementById('speed').value;
    const videoCount = document.getElementById('videoCount').value;

    if (keyword && speed && videoCount) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url.includes("youtube.com")) {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error injecting script:", chrome.runtime.lastError.message);
            } else {
              chrome.tabs.sendMessage(activeTab.id, { 
                action: "startDetox", 
                keyword, 
                speed: parseFloat(speed), 
                videoCount: parseInt(videoCount) 
              });
              chrome.runtime.sendMessage({ 
                action: "startDetox", 
                keyword, 
                speed: parseFloat(speed), 
                videoCount: parseInt(videoCount) 
              });
              inputForm.style.display = "none";
              taskStatus.style.display = "block";
            }
          });
        } else {
          console.error("Active tab is not a YouTube page.");
        }
      });
    } else {
      console.error("All fields must be filled.");
    }
  });

  viewDetails.addEventListener('click', () => {
    chrome.tabs.create({ url: "taskdetails.html" });
  });
});