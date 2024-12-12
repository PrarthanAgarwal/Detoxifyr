export const YouTubeConfig = {
    clientId: import.meta.env.VITE_YOUTUBE_CLIENT_ID || '',
    apiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
    
    // API Endpoints
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    
    // Quota limits
    dailyQuotaLimit: 10000,
    
    // OAuth2 Scopes
    scopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl'
    ],
    
    // Request timeouts (in milliseconds)
    timeout: 10000,
    
    // Rate limiting
    rateLimit: {
        maxRequests: 100,
        windowMs: 60 * 1000 // 1 minute
    }
}; 