import { ENV } from '@/conf';

export interface BsaBankAccount {
  account_id?: string | number | null;
  user_id?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  created_at?: string | null;
  account_number?: string | null;
  account_type?: string | null;
}

export interface BankAccounts {
  account_id?: string | number | null;
  accountId?: string | number | null;
  entityName?: string | null;
  entityType?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  bankCode?: string | null;
  bank_name?: string | null;
}

export interface DateRange {
  from_date?: string | null;
  to_date?: string | null;
}

export async function getBankAccounts(
  custId?: string | number
): Promise<BankAccounts[]> {
  if (!custId) return [];
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1x-bank-accounts/${custId}`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch bank accounts. Please try again!');
  }
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
}

export async function getDateRange(
  accountNumber: string,
  custId?: string | number
): Promise<DateRange> {
  if (!accountNumber) return {};
  const url = custId
    ? `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-report-date-range/${custId}`
    : `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-report-date-range`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account_number: accountNumber }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch date range. Please try again!');
  }
  const result = await response.json();
  return result?.data || {};
}

export async function getBankAccountDetails(
  accountNumber: string,
  custId?: string | number
) {
  if (!accountNumber) return null;
  const url = custId
    ? `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1x-account-details/${custId}`
    : `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1x-account-details`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account_number: accountNumber }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch account details');
  }
  const result = await response.json();
  return result?.data?.account_details;
}

export async function getIndividualOverview(
  custId: string | number,
  params: {
    account_number: string;
    from_date?: string;
    to_date?: string;
  }
) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/individual/r1x-overview/${custId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load overview monthlywise. Please try again.');
  }
  return await response.json();
}

export async function getIndividualEodAnalysis(
  custId: string | number,
  params: {
    account_number: string;
    from_date?: string;
    to_date?: string;
  }
) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/individual/r1x-eod-analysis/${custId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load EOD analysis. Please try again.');
  }
  return await response.json();
}

export async function getIndividualLoanTransactions(
  custId: string | number,
  params: {
    account_number: string;
    from_date?: string;
    to_date?: string;
  }
) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/individual/r1x-loan-transactions/${custId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load loan transactions. Please try again.');
  }
  return await response.json();
}

export async function getSummaryOfDebitAndCredit(
  custId: string | number,
  params: {
    account_number: string;
    from_date: string;
    to_date: string;
  }
) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-summary-of-debit-and-credit_monthwise/${custId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load summary of debit and credit.');
  }
  return await response.json();
}

export async function getCashFlow(
  custId: string | number,
  params: {
    account_number: string;
    from_date: string;
    to_date: string;
  }
) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-cashflow/${custId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load cash flow.');
  }
  return await response.json();
}

export async function getMonthWiseOverview(
  custId: string | number,
  params: {
    account_number: string;
    from_date: string;
    to_date: string;
  }
) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-month-wise-overview/${custId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load month wise overview.');
  }
  return await response.json();
}

