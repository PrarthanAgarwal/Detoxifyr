import { LoginStatus } from '../types';

const REQUIRED_COOKIES = ['SAPISID', 'APISID', '__Secure-3PAPISID'];
const YOUTUBE_DOMAIN = '.youtube.com';

const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.runtime?.id !== undefined;
};

export const REQUIRED_PERMISSIONS = {
  permissions: ['identity', 'identity.email', 'cookies'] as const,
  origins: [
    'https://*.youtube.com/*',
    'https://www.googleapis.com/*',
    'https://accounts.google.com/*'
  ] as const
} as const;

const checkPermissions = async (): Promise<boolean> => {
  try {
    // Check each permission individually
    const permissionResults = await Promise.all(
      (REQUIRED_PERMISSIONS.permissions ?? []).map(async permission => {
        const result = await chrome.permissions.contains({
          permissions: [permission]
        });
        console.log(`Permission check for ${permission}:`, result);
        return result;
      })
    );

    // Check each origin individually
    const originResults = await Promise.all(
      (REQUIRED_PERMISSIONS.origins ?? []).map(async origin => {
        const result = await chrome.permissions.contains({
          origins: [origin]
        });
        console.log(`Origin check for ${origin}:`, result);
        return result;
      })
    );

    const allPermissionsGranted = permissionResults.every(result => result);
    const allOriginsGranted = originResults.every(result => result);

    console.log('All permissions granted:', allPermissionsGranted);
    console.log('All origins granted:', allOriginsGranted);

    return allPermissionsGranted && allOriginsGranted;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};

const checkYouTubeCookies = async (): Promise<boolean> => {
  try {
    const cookies = await chrome.cookies.getAll({ domain: YOUTUBE_DOMAIN });
    console.log('All YouTube cookies:', cookies.map(c => ({ name: c.name, exists: !!c.value })));
    
    // Check if ANY of the required cookies exist
    const hasRequiredCookie = REQUIRED_COOKIES.some(name => 
      cookies.some(cookie => cookie.name === name && cookie.value)
    );
    console.log('Has required cookies:', hasRequiredCookie);

    // Also check for other authentication cookies
    const hasOtherAuthCookies = cookies.some(cookie => 
      (cookie.name.includes('SID') || cookie.name.includes('SSID')) && cookie.value
    );
    console.log('Has other auth cookies:', hasOtherAuthCookies);

    const isLoggedIn = hasRequiredCookie || hasOtherAuthCookies;
    console.log('Final cookie check result:', isLoggedIn);
    return isLoggedIn;
  } catch (error) {
    console.warn('Cookie check failed:', error);
    return false;
  }
};

const getUserInfo = async (): Promise<chrome.identity.UserInfo | null> => {
  try {
    const userInfo = await new Promise<chrome.identity.UserInfo>((resolve) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
        console.log('User info result:', userInfo);
        resolve(userInfo);
      });
    });
    return userInfo;
  } catch (error) {
    console.warn('Failed to get user info:', error);
    return null;
  }
};

export const checkYouTubeLoginStatus = async (): Promise<LoginStatus> => {
  console.log('Starting YouTube login status check...');
  
  if (!isExtensionEnvironment()) {
    console.log('Not in extension environment');
    return {
      isLoggedIn: true,
      email: 'dev@example.com'
    };
  }

  try {
    const hasPermissions = await checkPermissions();
    console.log('Permission check completed:', hasPermissions);
    
    if (!hasPermissions) {
      console.warn('Missing required permissions');
      return { isLoggedIn: false };
    }

    const hasCookies = await checkYouTubeCookies();
    console.log('Cookie check completed:', hasCookies);
    
    if (!hasCookies) {
      console.warn('No valid YouTube cookies found');
      return { isLoggedIn: false };
    }

    const userInfo = await getUserInfo();
    console.log('User info retrieved:', userInfo);
    
    return {
      isLoggedIn: true,
      email: userInfo?.email || 'YouTube User'
    };

  } catch (err: unknown) {
    console.error('Login check failed:', err);
    return { isLoggedIn: false };
  }
};