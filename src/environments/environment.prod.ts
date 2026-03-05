export const environment = {
  production: true,
  baseUrl: (window as any)?.__env?.API_BASE_URL || 'https://api.example.com/api/auth',
  mediaBaseUrl: (window as any)?.__env?.MEDIA_BASE_URL || '',
  encryptionKey: (window as any)?.__env?.ENCRYPTION_KEY || '',
  // Non-sensitive salt used for client-side derivations only.
  encryptionSalt: 'start-here-salt'
};
