import type { CibilFieldErrors, CibilGenerateOtpField } from './types';

interface ApiErrorPayload {
  message?: string;
  responseCode?: string;
  responsecode?: string;
  detail?: {
    message?: string;
    responseCode?: string;
    responsecode?: string;
  };
}

export interface CibilMappedError {
  fieldErrors: CibilFieldErrors;
  globalError?: string;
}

const FIELD_LABELS: Record<CibilGenerateOtpField, string> = {
  first_name: 'First name',
  middle_name: 'Middle name',
  last_name: 'Last name',
  date_of_birth: 'Date of birth',
  gender: 'Gender',
  mobile_number: 'Mobile number',
  address: 'Address',
  state: 'State',
  pincode: 'Pincode',
  identity: 'Identity',
  identityType: 'Identity type',
};

const FIELD_CODE_MAP: Partial<Record<string, CibilGenerateOtpField[]>> = {
  ELN2004: ['first_name'],
  EMN2014: ['middle_name'],
  ELN2005: ['last_name'],
  EEA2006: ['address'],
  EEG2015: ['gender'],
  EIN2009: ['identity'],
  EMN2010: ['mobile_number'],
  EDB2012: ['date_of_birth'],
  ESC2008: ['state'],
  EEP2007: ['pincode'],
  EMS2013: ['state', 'pincode'],
};

const FIELD_MESSAGE_MAP: Array<{
  field: CibilGenerateOtpField;
  patterns: RegExp[];
}> = [
  {
    field: 'first_name',
    patterns: [/\bfirst_name\b/i, /\bfirst name\b/i],
  },
  {
    field: 'middle_name',
    patterns: [/\bmiddle_name\b/i, /\bmiddle name\b/i],
  },
  {
    field: 'last_name',
    patterns: [/\blast_name\b/i, /\blast name\b/i],
  },
  {
    field: 'date_of_birth',
    patterns: [
      /\bdate_of_birth\b/i,
      /\bdate of birth\b/i,
      /\bdob\b/i,
      /\bbirth date\b/i,
    ],
  },
  {
    field: 'gender',
    patterns: [/\bgender\b/i],
  },
  {
    field: 'mobile_number',
    patterns: [
      /\bmobile_number\b/i,
      /\bmobile number\b/i,
      /\bmobile\b/i,
      /\bphone\b/i,
    ],
  },
  {
    field: 'address',
    patterns: [/\baddress\b/i],
  },
  {
    field: 'state',
    patterns: [/\bstate\b/i, /\bstate code\b/i],
  },
  {
    field: 'pincode',
    patterns: [/\bpincode\b/i, /\bpin code\b/i],
  },
  {
    field: 'identity',
    patterns: [
      /\bidentity number\b/i,
      /\bidentity_number\b/i,
      /\bid number\b/i,
      /\bidNumber\b/i,
      /\bpan\b/i,
    ],
  },
  {
    field: 'identityType',
    patterns: [/\bidentity type\b/i, /\bid type\b/i, /\bidType\b/i],
  },
];

const GLOBAL_CODE_MESSAGES: Partial<Record<string, string>> = {
  EPI022: 'Payload is incorrect. Please review the submitted details.',
  EEI2002: 'There is an error in the submitted input.',
  EBF017: 'One or more required fields are blank.',
  EIB721: 'Incorrect bureau type configured for this request.',
  ENR901: 'Request limit exceeded. Please try again later.',
  ELL420: 'Login attempts limit exceeded. Please try again later.',
  SYS_INT_ERR: 'CIBIL service is currently unavailable. Please try again later.',
};

const GLOBAL_MESSAGE_PATTERNS = [
  /invalid json/i,
  /payload is empty/i,
  /payload is incorrect/i,
  /error in input/i,
  /blank input field/i,
  /incorrect bureau type/i,
  /request limit exceeded/i,
  /login attempts limit exceeded/i,
  /service unavailable/i,
  /gateway/i,
  /internal server error/i,
];

const getFieldDefaultMessage = (
  field: CibilGenerateOtpField,
  message: string
) => {
  return message || `${FIELD_LABELS[field]} is invalid.`;
};

const extractErrorPayload = (error: unknown): ApiErrorPayload => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    return error.response.data as ApiErrorPayload;
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return {};
};

const getMessageAndCode = (payload: ApiErrorPayload) => {
  const detail = payload.detail;

  return {
    message: detail?.message || payload.message || 'Request failed',
    responseCode:
      detail?.responseCode ||
      detail?.responsecode ||
      payload.responseCode ||
      payload.responsecode ||
      null,
  };
};

export function mapCibilGenerateOtpError(error: unknown): CibilMappedError {
  const payload = extractErrorPayload(error);
  const { message, responseCode } = getMessageAndCode(payload);
  const fieldErrors: CibilFieldErrors = {};

  if (responseCode === 'EMS2013') {
    fieldErrors.state = message;
    fieldErrors.pincode = message;
    return { fieldErrors };
  }

  const codeFields = responseCode ? FIELD_CODE_MAP[responseCode] : undefined;
  if (codeFields?.length) {
    codeFields.forEach((field) => {
      fieldErrors[field] = getFieldDefaultMessage(field, message);
    });
    return { fieldErrors };
  }

  const matchingMessageFields = FIELD_MESSAGE_MAP.filter(({ patterns }) =>
    patterns.some((pattern) => pattern.test(message))
  ).map(({ field }) => field);

  if (/\bidentity\b/i.test(message) && matchingMessageFields.length === 0) {
    matchingMessageFields.push('identity');
  }

  if (/state/i.test(message) && /pincode|pin code/i.test(message)) {
    matchingMessageFields.push('state', 'pincode');
  }

  if (matchingMessageFields.length) {
    Array.from(new Set(matchingMessageFields)).forEach((field) => {
      fieldErrors[field] = getFieldDefaultMessage(field, message);
    });
    return { fieldErrors };
  }

  if (
    (responseCode && GLOBAL_CODE_MESSAGES[responseCode]) ||
    GLOBAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
  ) {
    return {
      fieldErrors,
      globalError:
        (responseCode && GLOBAL_CODE_MESSAGES[responseCode]) || message,
    };
  }

  return {
    fieldErrors,
    globalError: message,
  };
}
