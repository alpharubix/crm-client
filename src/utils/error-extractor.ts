/**
 * Extracts a human-readable error message from backend / FastAPI responses.
 * Handles:
 *  - detail as an object with message or msg: { detail: { message: "Date should not be in the past" } }
 *  - detail as a string: { detail: "Account not found" }
 *  - detail as an array (e.g. Pydantic validation errors): { detail: [{ loc: [...], msg: "..." }] }
 *  - top-level message or msg: { message: "..." }
 */
export function extractErrorMessage(errorData: any, fallback = 'An unexpected error occurred'): string {
  if (!errorData) return fallback;
  if (typeof errorData === 'string') return errorData;

  if (errorData.detail) {
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    }
    if (typeof errorData.detail === 'object') {
      if (typeof errorData.detail.message === 'string') {
        return errorData.detail.message;
      }
      if (typeof errorData.detail.msg === 'string') {
        return errorData.detail.msg;
      }
      if (Array.isArray(errorData.detail)) {
        return errorData.detail
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && item.msg) {
              const field = Array.isArray(item.loc)
                ? item.loc.filter((l: any) => l !== 'body').join('.')
                : '';
              return field ? `${field}: ${item.msg}` : item.msg;
            }
            return JSON.stringify(item);
          })
          .filter(Boolean)
          .join(', ');
      }
      return JSON.stringify(errorData.detail);
    }
  }

  if (typeof errorData.message === 'string') return errorData.message;
  if (typeof errorData.msg === 'string') return errorData.msg;
  if (typeof errorData.error === 'string') return errorData.error;

  return fallback;
}
