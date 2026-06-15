import { appConfig, isIamEnabled } from '@/config';
import { IAMBrowserClient } from './browserClient';

export const iamClient = new IAMBrowserClient({
  gatewayUrl: appConfig.gatewayUrl || 'https://hasham.platform.dev.chamsswitch.com/gateway',
  clientId: appConfig.iamClientId || 'kardit-browser-client',
  callbackPath: appConfig.iamCallbackPath,
  storageKey: appConfig.iamStorageKey,
});

export { isIamEnabled };
export type { TokenClaims } from './browserClient';
