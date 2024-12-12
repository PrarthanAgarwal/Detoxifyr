export interface YouTubeApiError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

export interface TokenResponse {
  tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    scope?: string;
  };
}

export interface Credentials {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
} 