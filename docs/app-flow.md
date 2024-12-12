# Detoxifyr Detailed App Flow Document

## 1. Launch and Initialization
### Check User Authentication
- On extension launch, check if the user is logged into YouTube by accessing cookies
- If not logged in, inform the user that logging in enhances the experience

### Load User Preferences
- Retrieve saved preferences from localStorage
- If no preferences are found, prompt the user to set them

## 2. User Preferences Setup
### Preferences Form
- Provide input fields for keywords (up to 5)
- Allow users to set average video length and total number of videos for the session
- Include advanced settings for:
  - Language preferences
  - Region code
  - Content length
  - View count threshold
  - Engagement ratio
  - Age limit

### Save Preferences
- On submission, validate and save preferences to localStorage

## 3. Start Detox Session
### Button Trigger
- User clicks "Start Detox" to begin the session

### Fetch Videos
- Use YouTube Data API v3 to search for videos matching keywords and other criteria
- Apply filters based on user preferences and quality metrics

## 4. Calculate Metrics
### Compute Scores
For each video, calculate:
- **Creator Authority Score** using channel data
- **Content Quality Score** using video data
- **Engagement Ratio** as likes / (likes + dislikes)

### Filter and Sort Videos
- Remove videos that do not meet threshold criteria
- Sort remaining videos based on combined scores

## 5. Display Curated List
### Video List UI
- Present videos with thumbnails, titles, durations, and scores
- Provide options to view more details or play the video

### Pagination
- If more videos are available than the user-selected number, implement pagination or infinite scroll

## 6. Video Interaction
### User-Initiated Navigation
- When user clicks on a video, open it in a new tab on youtube.com
- Track the click in the session history
- Update engagement metrics based on user interaction

### Session Tracking
- Log clicked videos to the SessionHistory data structure
- Store basic video metadata for history display

## 7. Review Session History
### History UI
- Allow users to view past sessions, including videos watched and dates

### Data Management
- Provide options to clear history or export data if desired

## 8. Error Handling and Notifications
### API Errors
- Handle cases where API requests fail
- Display user-friendly error messages

### Content Availability
- Notify users if insufficient content is available matching their criteria
- Suggest adjusting preferences

## 9. Settings and Help
### Settings Menu
- Allow users to update preferences and advanced settings at any time

### Help Section
- Provide FAQs, usage instructions, and contact information

## 10. Compliance and Privacy Measures
### Privacy Policy Display
- Make the privacy policy easily accessible within the extension

### Data Usage Transparency
- Clearly inform users about what data is stored locally and how it's used

## 11. Updates and Maintenance
### Version Checks
- Implement a mechanism to check for extension updates

### User Notifications
- Notify users of significant changes or new features

## User Interaction Flow Summary
1. **Initial Setup:** User installs the extension and sets up preferences
2. **Starting a Session:** User clicks "Start Detox" and extension fetches curated videos
3. **Watching Videos:** User selects and watches videos within the extension
4. **Session Completion:** Session history is saved and user can review or start a new session

## API Interaction Details
### YouTube Data API v3 Endpoints
- search.list for searching videos
- videos.list for retrieving video details and statistics
- channels.list for obtaining channel information

### API Optimization
- Use appropriate parameters to limit data returned
- Implement caching to reduce redundant API calls

### Quota Management
- Monitor API usage to prevent exceeding quotas
- Implement fallbacks or inform the user if quotas are close to being reached

## Compliance Considerations
### YouTube Policies
- Ensure all API usage complies with YouTube's Terms of Service
- Avoid artificially manipulating engagement metrics

### User Privacy
- Do not collect personal data without explicit consent
- Store user preferences and session data locally

### Third-Party Libraries
- Use reputable libraries
- Keep libraries updated to avoid security vulnerabilities
