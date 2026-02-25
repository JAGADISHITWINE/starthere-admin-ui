export const environment = {
  production: true,
  // TODO: set this to your production API URL (example shown). Replace before deploying.
  baseUrl: 'https://api.example.com/api/auth',
  encryptionKey: (window as any)?.__env?.ENCRYPTION_KEY || '',
  // Non-sensitive salt used for client-side derivations only.
  encryptionSalt: 'start-here-salt'
};
