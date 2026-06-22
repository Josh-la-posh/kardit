import { ApiError, getApiErrorMessage } from '@/services/apiError';

export interface PelpayState {
  id: string;
  stateName: string;
  countryId: string;
}

export interface PelpayCountry {
  id: string;
  countryName: string;
  isSupported: boolean;
  states: PelpayState[];
}

interface PelpayCountriesResponse {
  requestSuccessful: boolean;
  responseData?: PelpayCountry[];
  message?: string;
}

const PELPAY_COUNTRIES_URL = 'https://api.pelpay.africa/api/Country';

export async function getCountriesWithStates(): Promise<PelpayCountry[]> {
  const res = await fetch(PELPAY_COUNTRIES_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    throw new ApiError(getApiErrorMessage(body, `Request failed (${res.status})`), res.status, body);
  }

  const payload = body as PelpayCountriesResponse | undefined;
  if (!payload?.requestSuccessful) {
    throw new ApiError(getApiErrorMessage(payload, 'Failed to load countries'), res.status, payload);
  }

  return Array.isArray(payload.responseData) ? payload.responseData : [];
}
