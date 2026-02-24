// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: 'http://localhost:4001/api/auth',
  // Do NOT store production secrets here. Use server-side secrets or a secure runtime config.
  // We keep a non-sensitive salt for client-side derivations only.
  encryptionKey: (window as any)?.__env?.ENCRYPTION_KEY || 'JagguBoss_Secret_2025!',
  encryptionSalt: (window as any)?.__env?.ENCRYPTION_SALT || 'start-here-salt',
};
