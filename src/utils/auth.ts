export const checkAuthStatus = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      if (result.authToken) {
        // Verify token is still valid
        fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + result.authToken)
          .then(response => response.json())
          .then(data => {
            resolve(!!data.expires_in);
          })
          .catch(() => {
            resolve(false);
          });
      } else {
        resolve(false);
      }
    });
  });
}; 