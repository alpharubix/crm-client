import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  getCibilWebhookStatus,
  listCibilReports,
} from '@/pages/cibil/api';
import type {
  CibilReportListItem,
  CibilReportStatus,
  CibilWebhookStatus,
} from './types';

interface ReportStatusProps {
  otpFlowId: string;
  onBack: () => void;
  onViewReport: (referenceId?: string) => void;
}

const POLL_INTERVAL_MS = 10000;
const MAX_POLLS = 8;

const normalizeWebhookStatus = (status: string): CibilWebhookStatus => {
  if (status === 'SUCCESS' || status === 'FAILED') return status;
  return 'IN_PROGRESS';
};

const getReportTime = (report: CibilReportListItem) => {
  const time = Date.parse(report.cibil_pulled_date);
  return Number.isNaN(time) ? 0 : time;
};
  
const getLatestReport = (reports: CibilReportListItem[]) => {
  return reports.reduce<CibilReportListItem | undefined>((latest, report) => {
    if (!latest) return report;
    return getReportTime(report) > getReportTime(latest) ? report : latest;
  }, undefined);
};

async function getReportStatus(
  otpFlowId: string,
  signal?: AbortSignal
): Promise<CibilReportStatus> {
  const statusResponse = await getCibilWebhookStatus(otpFlowId, { signal });
  const webhookStatus = normalizeWebhookStatus(
    statusResponse.data.webhook_status
  );

  if (webhookStatus === 'SUCCESS') {
    const reportsResponse = await listCibilReports({ signal });
    const latestReport = getLatestReport(reportsResponse.data);

    if (!latestReport?.reference_id) {
      throw new Error(
        'CIBIL report is marked ready, but no report reference was returned.'
      );
    }

    return {
      has_received: true,
      webhook_status: webhookStatus,
      reference_id: latestReport.reference_id,
      message: 'CIBIL report has been received successfully.',
    };
  }

  if (webhookStatus === 'FAILED') {
    return {
      has_received: false,
      webhook_status: webhookStatus,
      message:
        statusResponse.message ||
        'CIBIL report generation failed. Please reinitiate the request.',
    };
  }

  return {
    has_received: false,
    webhook_status: webhookStatus,
    message:
      statusResponse.message ||
      'Waiting for CIBIL report callback from the bureau.',
  };
}

export default function ReportStatus({
  otpFlowId,
  onBack,
  onViewReport,
}: ReportStatusProps) {
  const [pollCount, setPollCount] = useState(0);
  const hasTimedOut = pollCount >= MAX_POLLS;

  const { data, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['cibilReportStatus', otpFlowId],
    queryFn: async ({ signal }) => {
      setPollCount((current) => current + 1);
      return getReportStatus(otpFlowId, signal);
    },
    enabled: Boolean(otpFlowId) && !hasTimedOut,
    refetchInterval: (query) => {
      const status = query.state.data?.webhook_status;
      if (status === 'SUCCESS' || status === 'FAILED') return false;
      return pollCount >= MAX_POLLS ? false : POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
    retry: 1,
  });

  const hasReceived = data?.has_received === true;
  const hasFailed = data?.webhook_status === 'FAILED';

  const handleRetry = () => {
    if (isFetching) return;
    setPollCount(0);
    void refetch();
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
      {isError ? (
        <div className="animate-in fade-in duration-300">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Status Check Failed
          </h2>
          <p className="text-gray-500 mb-6">
            {(error as Error)?.message || 'Unable to check report status.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-100 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isFetching}
              className="bg-[#000000] text-white px-6 py-2 rounded-md hover:bg-[#000000]/50 transition-colors"
            >
              {isFetching ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      ) : hasFailed ? (
        <div className="animate-in fade-in duration-300">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Report Generation Failed
          </h2>
          <p className="text-gray-500 mb-6">
            {data?.message || 'The bureau could not generate the CIBIL report.'}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="bg-[#000000] text-white px-6 py-2 rounded-md hover:bg-[#000000]/50 transition-colors"
          >
            Back to OTP
          </button>
        </div>
      ) : hasReceived ? (
        <div className="animate-in zoom-in duration-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Report Ready
          </h2>
          <p className="text-gray-500 mb-6">
            The CIBIL report has been received and is ready to view.
          </p>
          <button
            type="button"
            onClick={() => onViewReport(data?.reference_id)}
            className="bg-[#000000] hover:bg-[#000000]/50 text-white font-medium py-2 px-6 rounded-md transition-colors shadow-md"
          >
            View Report
          </button>
        </div>
      ) : hasTimedOut ? (
        <div className="animate-in fade-in duration-300">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Taking Longer Than Expected
          </h2>
          <p className="text-gray-500 mb-6">
            The report is still in progress after several checks. You can retry
            the status check or come back later.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-100 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isFetching}
              className="bg-[#000000] text-white px-6 py-2 rounded-md hover:bg-[#000000]/50 transition-colors"
            >
              {isFetching ? 'Checking...' : 'Retry'}
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-[#000000] border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-[#000000] font-semibold text-sm">
              {Math.min(90, Math.round((pollCount / MAX_POLLS) * 100))}%
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Waiting for Report
          </h2>
          <p className="text-gray-500 mb-2">
            We are checking whether the CIBIL report has been received.
          </p>
          <p className="text-sm text-gray-500 mb-5">
            {data?.message || 'Next status check runs every few seconds.'}
          </p>
          <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500 mb-5">
            Flow ID: <span className="font-semibold text-gray-700">{otpFlowId}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isFetching}
            className="text-sm text-[#000000] hover:underline disabled:text-gray-400"
          >
            {isFetching ? 'Checking...' : 'Check status now'}
          </button>
        </div>
      )}
    </div>
  );
}
