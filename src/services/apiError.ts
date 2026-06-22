export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getApiErrorMessage(errorBody: unknown, fallback: string): string {
  if (!errorBody) return fallback;

  if (typeof errorBody === 'string') return errorBody;

  if (typeof errorBody === 'object') {
    const body = errorBody as Record<string, unknown>;
    const nestedError = body.Error || body.error;

    const validationErrors = body.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      for (const value of Object.values(validationErrors as Record<string, unknown>)) {
        if (Array.isArray(value) && value.length > 0) {
          const first = value[0];
          if (typeof first === 'string' && first.trim()) return first;
        }
        if (typeof value === 'string' && value.trim()) return value;
      }
    }

    if (nestedError && typeof nestedError === 'object') {
      const errorRecord = nestedError as Record<string, unknown>;
      if (typeof errorRecord.Message === 'string' && errorRecord.Message.trim()) return errorRecord.Message;
      if (typeof errorRecord.message === 'string' && errorRecord.message.trim()) return errorRecord.message;
      if (typeof errorRecord.Code === 'string' && errorRecord.Code.trim()) return errorRecord.Code;
      if (typeof errorRecord.code === 'string' && errorRecord.code.trim()) return errorRecord.code;
    }

    if (typeof body.Message === 'string' && body.Message.trim()) return body.Message;
    if (typeof body.error === 'string' && body.error.trim()) return body.error;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.Error === 'string' && body.Error.trim()) return body.Error;
    if (typeof body.Title === 'string' && body.Title.trim()) return body.Title;
    if (typeof body.title === 'string' && body.title.trim()) return body.title;
    if (typeof body.Detail === 'string' && body.Detail.trim()) return body.Detail;
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
  }

  return fallback;
}
