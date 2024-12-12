# Detoxifyr Project Requirements Document

## Objective
Develop a browser extension named **Detoxifyr** that empowers users to personalize and detoxify their YouTube feed. The extension will allow users to input content preferences and provide a curated list of videos based on specified keywords and quality metrics. Users can click through to watch videos on YouTube directly, influencing their recommendations through genuine engagement.

## Key Features

### 1. User Preferences Input
- Allow users to input up to **5 keywords** representing the content they desire
- Specify the **average length of videos** they prefer
- Select the **number of videos** to include in each detox session

### 2. Quality Metrics Implementation
- **CREATOR_AUTHORITY_SCORE:** Combines channel metrics like subscriber count and verification status
- **CONTENT_QUALITY_SCORE:** Combines engagement metrics like view count, likes, dislikes, and comments

### 3. Advanced Filtering Options
- **VIEW_COUNT_THRESHOLD:** Set a minimum view count to ensure video popularity/credibility
- **ENGAGEMENT_RATIO:** Filter content based on the ratio of likes to dislikes
- **AGE_LIMIT:** Limit content based on how recent it is
- **LANGUAGE_PREFERENCES:** Set primary and fallback languages
- **REGION_CODE:** Customize content based on specific locations
- **CONTENT_LENGTH:** Specify minimum and maximum video durations

### 4. Curated Video List
- Generate and display a list of videos that meet the user's criteria
- Provide detailed information like titles, thumbnails, durations, and quality scores
- Allow users to click through to watch videos on YouTube directly

### 5. Session Management
- Keep track of videos clicked during each detox session
- Allow users to view their session history within the extension

### 6. User Interface
- Design an intuitive and user-friendly interface
- Ensure compatibility across major browsers (Chrome, Firefox, Edge)

### 7. Compliance and Privacy
- Adhere to YouTube's Terms of Service and Developer Policies
- Provide a clear privacy policy detailing data usage and user rights

## Non-Functional Requirements

### Performance
- Optimize API calls to stay within YouTube's quota limits
- Implement caching strategies to enhance performance

### Security
- Secure handling of API keys and user data
- Protect against common web vulnerabilities (e.g., XSS, CSRF)

### Scalability
- Design the extension to accommodate future feature additions

### Usability
- Ensure the extension is accessible and easy to use for people with varying technical skills
