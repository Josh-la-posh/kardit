const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const appConfig = {
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api/v1'),
  gatewayUrl: trimTrailingSlash(import.meta.env.VITE_GATEWAY_URL || ''),
  iamClientId: import.meta.env.VITE_IAM_CLIENT_ID || '',
  iamTenantCode: import.meta.env.VITE_IAM_TENANT_CODE || undefined,
  iamCallbackPath: import.meta.env.VITE_IAM_CALLBACK_PATH || '/callback',
  iamStorageKey: import.meta.env.VITE_IAM_STORAGE_KEY || 'kd_s0',
};

export const isIamEnabled = Boolean(appConfig.gatewayUrl && appConfig.iamClientId);

export const expectedIamCallbackUrl =
  typeof window === 'undefined' ? appConfig.iamCallbackPath : `${window.location.origin}${appConfig.iamCallbackPath}`;
