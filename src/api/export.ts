import { ENV } from '@/conf';

export interface ExportBsaReportParams {
  account_number?: string;
  account_id?: string | number | null;
  from_date?: string;
  to_date?: string;
  cust_id?: string;
}

/**
 * Download the BSA Excel report from /accounts/export-report
 */
export const downloadBsaReport = async (
  paramsOrAccountNumber: string | ExportBsaReportParams,
  optionalAccountId?: string | number | null
): Promise<void> => {
  let account_number = '';
  let account_id = '';

  if (
    typeof paramsOrAccountNumber === 'object' &&
    paramsOrAccountNumber !== null
  ) {
    account_number = String(
      paramsOrAccountNumber.account_number ||
        paramsOrAccountNumber.account_id ||
        ''
    );
    account_id = String(
      paramsOrAccountNumber.account_id ||
        paramsOrAccountNumber.account_number ||
        ''
    );
  } else {
    account_number = String(paramsOrAccountNumber || '');
    account_id = String(optionalAccountId || paramsOrAccountNumber || '');
  }

  try {
    const response = await fetch(
      `${ENV.VITE_BACKEND_BASE_URL}/accounts/export-report`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number,
          account_id,
        }),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      let serverMsg = 'Failed to download BSA report';
      try {
        const json = await response.json();
        serverMsg =
          json.detail?.message ||
          json.detail ||
          json.message ||
          serverMsg;
      } catch {
        // ignore JSON parse error
      }
      throw new Error(
        typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)
      );
    }

    let filename = `Bsa_analysis_report_${account_number || account_id}.xlsx`;
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
  } catch (error: any) {
    const msg = error?.message || 'Failed to download BSA report';
    throw new Error(msg);
  }
};

export const downloadAll3ReportFiles = downloadBsaReport;
