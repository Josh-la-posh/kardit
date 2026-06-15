import { appConfig, isIamEnabled } from '@/config';
import { iamClient } from '@/iam';

let installed = false;

function shouldUseDpop(input: RequestInfo | URL): boolean {
  if (!isIamEnabled || !iamClient.isAuthenticated()) return false;

  const url = new URL(
    typeof input === 'string' || input instanceof URL ? input.toString() : input.url,
    window.location.origin
  );
  const gateway = new URL(appConfig.gatewayUrl, window.location.origin);
  const apiBase = new URL(appConfig.apiBaseUrl || '/api/v1', window.location.origin);

  const isGatewayApi = url.origin === gateway.origin && url.pathname.startsWith(gateway.pathname);
  const isAppApi = url.origin === apiBase.origin && url.pathname.startsWith(apiBase.pathname);
  const isIamAuthEndpoint = url.pathname.startsWith(`${gateway.pathname.replace(/\/$/, '')}/auth/`);

  return (isGatewayApi || isAppApi) && !isIamAuthEndpoint;
}

export function installIamFetch(): void {
  if (installed || typeof window === 'undefined') return;

  const rawFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (shouldUseDpop(input)) {
      return iamClient.dpopFetch(input, init);
    }
    return rawFetch(input, init);
  };
  installed = true;
}
