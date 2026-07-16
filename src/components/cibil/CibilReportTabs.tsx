import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import {
  getCibilAccountSummary,
  getCibilAnalysis,
  getCibilOverview,
  getCibilPaymentHistory,
} from '@/pages/cibil/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  EmptyReportState,
  ErrorState,
  LoadingState,
} from './ReportPrimitives';

import OverviewTab from './OverviewTab';
import AccountSummaryTab from './AccountSummaryTab';
import PaymentHistoryTab from './PaymentHistoryTab';
import AnalysisTab from './AnalysisTab';

type TabValue = 'overview' | 'account-summary' | 'payements-history' | 'analysis';

type QueryState<T> = {
  data?: T;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

const reportTabs: Array<{ value: TabValue; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'account-summary', label: 'Account Summary' },
  { value: 'payements-history', label: 'Payements History' },
  { value: 'analysis', label: 'Analysis' },
];

const tabIndices: Record<TabValue, number> = {
  'overview': 0,
  'account-summary': 1,
  'payements-history': 2,
  'analysis': 3,
};

function QueryBoundary<T>({ query, children }: { query: QueryState<T>; children: (data: T) => React.ReactElement }) {
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error?.message || 'Unable to load this report section.'} />;
  if (!query.data) return <EmptyReportState />;
  return children(query.data);
}

export default function CibilReportTabs({ referenceId }: { referenceId: string }) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [prevTab, setPrevTab] = useState<TabValue>('overview');
  const enabled = Boolean(referenceId);

  const overviewQuery = useQuery({
    queryKey: ['cibilOverview', referenceId],
    queryFn: () => getCibilOverview(referenceId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const accountSummaryQuery = useQuery({
    queryKey: ['cibilAccountSummary', referenceId],
    queryFn: () => getCibilAccountSummary(referenceId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const paymentHistoryQuery = useQuery({
    queryKey: ['cibilPaymentHistory', referenceId],
    queryFn: () => getCibilPaymentHistory(referenceId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const analysisQuery = useQuery({
    queryKey: ['cibilAnalysis', referenceId],
    queryFn: () => getCibilAnalysis(referenceId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const tabStatuses = useMemo(
    () => ({
      overview: overviewQuery.isFetching,
      'account-summary': accountSummaryQuery.isFetching,
      'payements-history': paymentHistoryQuery.isFetching,
      analysis: analysisQuery.isFetching,
    }),
    [
      accountSummaryQuery.isFetching,
      analysisQuery.isFetching,
      overviewQuery.isFetching,
      paymentHistoryQuery.isFetching,
    ]
  );

  const handleTabChange = (value: string) => {
    const nextTab = value as TabValue;
    setPrevTab(activeTab);
    setActiveTab(nextTab);
  };

  const direction = tabIndices[activeTab] >= tabIndices[prevTab] ? 1 : -1;
  const initialX = direction === 1 ? 150 : -150;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5 overflow-hidden">
      <div className="overflow-x-auto">
        <TabsList className="h-auto min-w-max justify-start rounded-md bg-slate-100 p-1">
          {reportTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2 rounded-sm px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white font-semibold text-slate-700"
            >
              {tab.label}
              {tabStatuses[tab.value] ? (
                <span className="h-2 w-2 rounded-full bg-current opacity-70 animate-pulse" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview" forceMount className="data-[state=inactive]:hidden">
        <QueryBoundary query={{ data: overviewQuery.data?.data, isLoading: overviewQuery.isLoading, isError: overviewQuery.isError, error: overviewQuery.error }}>
          {(data) => (
            <motion.div
              key={`overview-${activeTab === 'overview' ? 'active' : 'inactive'}`}
              initial={{ x: initialX, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              <OverviewTab data={data} />
            </motion.div>
          )}
        </QueryBoundary>
      </TabsContent>

      <TabsContent value="account-summary" forceMount className="data-[state=inactive]:hidden">
        <QueryBoundary query={{ data: accountSummaryQuery.data?.data, isLoading: accountSummaryQuery.isLoading, isError: accountSummaryQuery.isError, error: accountSummaryQuery.error }}>
          {(data) => (
            <motion.div
              key={`summary-${activeTab === 'account-summary' ? 'active' : 'inactive'}`}
              initial={{ x: initialX, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              <AccountSummaryTab data={data} />
            </motion.div>
          )}
        </QueryBoundary>
      </TabsContent>

      <TabsContent value="payements-history" forceMount className="data-[state=inactive]:hidden">
        <QueryBoundary query={{ data: paymentHistoryQuery.data?.data, isLoading: paymentHistoryQuery.isLoading, isError: paymentHistoryQuery.isError, error: paymentHistoryQuery.error }}>
          {(data) => (
            <motion.div
              key={`history-${activeTab === 'payements-history' ? 'active' : 'inactive'}`}
              initial={{ x: initialX, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              <PaymentHistoryTab data={data} />
            </motion.div>
          )}
        </QueryBoundary>
      </TabsContent>

      <TabsContent value="analysis" forceMount className="data-[state=inactive]:hidden">
        <QueryBoundary query={{ data: analysisQuery.data?.data, isLoading: analysisQuery.isLoading, isError: analysisQuery.isError, error: analysisQuery.error }}>
          {(data) => (
            <motion.div
              key={`analysis-${activeTab === 'analysis' ? 'active' : 'inactive'}`}
              initial={{ x: initialX, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              <AnalysisTab data={data} />
            </motion.div>
          )}
        </QueryBoundary>
      </TabsContent>
    </Tabs>
  );
}
