# Detoxifyr

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Contributing](#contributing)

## Introduction

Detoxifyr is a Chrome extension designed to help users "detoxify" their YouTube experience. It allows users to input keywords for positive content they want to engage with, automating the process of searching for and watching videos related to those topics. This tool aims to counteract the potential negative effects of YouTube's recommendation algorithm by actively seeking out content that aligns with the user's desired viewing preferences.

## Features

- **Keyword-based Video Search**: Users can input keywords for topics they want to explore.
- **Customizable Playback Speed**: Videos can be watched at normal speed, 1.5x, 1.75x, or 2x speed.
- **Adjustable Video Count**: Users can choose to watch between 1 to 10 videos in a session.
- **Background Execution**: The extension continues to run even when the popup is closed or the user navigates away from YouTube.
- **Real-time Status Updates**: Users can view the current status of their detox session, including the number of videos watched.
- **Task History**: A comprehensive history of all detox sessions is maintained and can be viewed by the user.
- **Task Termination**: Users have the option to terminate an ongoing detox session.

## Installation

To install the YouTube Detoxifyr extension:

1. Clone this repository or download the source code.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.
5. The YouTube Detoxifyr extension should now appear in your list of installed extensions.

## Usage

1. Click on the YouTube Detoxifyr extension icon in your Chrome toolbar.
2. Enter a keyword for the type of content you want to watch.
3. Select the desired playback speed from the dropdown menu.
4. Choose the number of videos you want to watch (1-10).
5. Click "Start Detox" to begin the session.
6. The extension will automatically search for and play videos based on your input.
7. You can view the current task status by clicking "View Task Details" in the popup.
8. To see your task history, click the "History" button in the main popup or the task details page.

## File Structure

- `manifest.json`: The extension's configuration file.
- `popup.html`: The HTML file for the extension's popup interface.
- `popup.js`: The JavaScript file handling the popup's functionality.
- `content.js`: The content script that interacts with YouTube pages.
- `background.js`: The background script managing the extension's core functionality.
- `taskdetails.html`: The HTML file for displaying task details and history.
- `taskdetails.js`: The JavaScript file handling the task details page functionality.

## Contributing

Contributions to the YouTube Detoxifyr project are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive commit messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.

Please ensure your code adheres to the existing style and includes appropriate comments and documentation.

---

I hope you find the YouTube Detoxifyr helpful in curating a more positive YouTube experience. If you encounter any issues or have suggestions for improvements, please open an issue on this GitHub repository.
