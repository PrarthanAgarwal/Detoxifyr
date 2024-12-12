interface TokenData {
    token: string;
    expiryDate: number;
}

export class YouTubeAuthService {
    private static instance: YouTubeAuthService;
    private tokenData: TokenData | null = null;
    private static TOKEN_STORAGE_KEY = 'youtube_auth_token';

    private constructor() {}

    public static getInstance(): YouTubeAuthService {
        if (!YouTubeAuthService.instance) {
            YouTubeAuthService.instance = new YouTubeAuthService();
        }
        return YouTubeAuthService.instance;
    }

    public async getValidToken(): Promise<string> {
        // Try to get cached token first
        if (this.tokenData && !this.isTokenExpired()) {
            return this.tokenData.token;
        }

        // Load from storage if not in memory
        await this.loadTokenFromStorage();
        if (this.tokenData && !this.isTokenExpired()) {
            return this.tokenData.token;
        }

        // Get new token if none exists or expired
        return this.getNewToken();
    }

    private async getNewToken(): Promise<string> {
        try {
            const token = await new Promise<string>((resolve, reject) => {
                chrome.identity.getAuthToken({ interactive: true }, (token) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (!token) {
                        reject(new Error('No token returned'));
                    } else {
                        resolve(token);
                    }
                });
            });

            this.tokenData = {
                token,
                expiryDate: Date.now() + (3600 * 1000) // Token typically expires in 1 hour
            };

            await this.saveTokenToStorage();
            return token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            throw new Error('Failed to authenticate with YouTube');
        }
    }

    public async revokeToken(): Promise<void> {
        if (!this.tokenData?.token) return;

        try {
            await new Promise<void>((resolve, reject) => {
                chrome.identity.removeCachedAuthToken(
                    { token: this.tokenData!.token },
                    () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    }
                );
            });

            this.tokenData = null;
            await this.clearStoredToken();
        } catch (error) {
            console.error('Error revoking token:', error);
            throw new Error('Failed to revoke YouTube authentication');
        }
    }

    private async saveTokenToStorage(): Promise<void> {
        if (!this.tokenData) return;
        
        try {
            await chrome.storage.local.set({
                [YouTubeAuthService.TOKEN_STORAGE_KEY]: this.tokenData
            });
        } catch (error) {
            console.error('Error saving token data:', error);
            throw new Error('Failed to save authentication data');
        }
    }

    private async loadTokenFromStorage(): Promise<void> {
        try {
            const data = await chrome.storage.local.get(YouTubeAuthService.TOKEN_STORAGE_KEY);
            this.tokenData = data[YouTubeAuthService.TOKEN_STORAGE_KEY] || null;
        } catch (error) {
            console.error('Error loading token data:', error);
            throw new Error('Failed to load authentication data');
        }
    }

    private async clearStoredToken(): Promise<void> {
        try {
            await chrome.storage.local.remove(YouTubeAuthService.TOKEN_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing token data:', error);
            throw new Error('Failed to clear authentication data');
        }
    }

    private isTokenExpired(): boolean {
        if (!this.tokenData?.expiryDate) return true;
        return Date.now() >= this.tokenData.expiryDate;
    }

    public async checkAuthStatus(): Promise<boolean> {
        try {
            await this.getValidToken();
            return true;
        } catch (error) {
            return false;
        }
    }
} 