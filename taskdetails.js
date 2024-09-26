function updateTaskDetails() {
  chrome.runtime.sendMessage({ action: "getTaskStatus" }, (response) => {
    const currentTaskTable = document.getElementById('currentTaskTable');
    const taskHistoryTableBody = document.getElementById('taskHistoryTable').getElementsByTagName('tbody')[0];
    const terminateButton = document.getElementById('terminateButton');

    // Update current task
    if (response.currentTask) {
      currentTaskTable.innerHTML = `
        <tr><th>Keyword</th><td>${response.currentTask.keyword}</td></tr>
        <tr><th>Speed</th><td>${response.currentTask.speed}x</td></tr>
        <tr><th>Video Count</th><td>${response.currentTask.completedVideos} / ${response.currentTask.videoCount}</td></tr>
        <tr><th>Start Time</th><td>${new Date(response.currentTask.startTime).toLocaleString()}</td></tr>
        <tr><th>Status</th><td class="status-${response.currentTask.status}">${response.currentTask.status}</td></tr>
      `;
      if (response.currentTask.status === "running") {
        terminateButton.style.display = "block";
      } else {
        terminateButton.style.display = "none";
      }
    } else {
      currentTaskTable.innerHTML = "<tr><td colspan='2'>No current task</td></tr>";
      terminateButton.style.display = "none";
    }

    // Update task history
    taskHistoryTableBody.innerHTML = '';
    response.taskHistory.slice().reverse().forEach(task => {
      const row = taskHistoryTableBody.insertRow();
      row.innerHTML = `
        <td>${task.keyword}</td>
        <td>${task.speed}x</td>
        <td>${task.completedVideos} / ${task.videoCount}</td>
        <td>${new Date(task.startTime).toLocaleString()}</td>
        <td>${task.endTime ? new Date(task.endTime).toLocaleString() : '-'}</td>
        <td class="status-${task.status}">${task.status}</td>
      `;
    });

    // Reset completed tasks
    if (response.currentTask && response.currentTask.status === "completed") {
      resetCompletedTask();
    }
  });
}

function resetCompletedTask() {
  chrome.runtime.sendMessage({ action: "resetTask" }, (response) => {
    if (response && response.status === "reset") {
      console.log("Task reset successfully");
    } else {
      console.error("Failed to reset task");
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateTaskDetails();
  setInterval(updateTaskDetails, 5000); // Update every 5 seconds

  document.getElementById('terminateButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "terminateTask" }, () => {
      updateTaskDetails();
    });
  });
});