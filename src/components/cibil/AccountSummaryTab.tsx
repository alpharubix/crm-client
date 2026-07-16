import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Info, Landmark, Calendar, Clock, DollarSign } from 'lucide-react';

// Helper to format values
const formatINR = (val: unknown) => {
  if (val === null || val === undefined || val === '') return '₹0';
  const num = Number(val);
  return isNaN(num) ? String(val) : `₹${num.toLocaleString('en-IN')}`;
};

export default function AccountSummaryTab({ data }: { data: any }) {
  const [activeSegment, setActiveSegment] = useState<'Active' | 'Closed'>('Active');
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  const cibilReport = data?.cibil_report?.EquifaxRetail || {};
  const accountsList = cibilReport.accountSummary || [];

  // Helper to normalize any account object to a standard flat structure
  const normalizeAccount = (acc: any) => {
    return {
      lender: acc.lender || 'N/A',
      accountNo: acc.accountNo || 'N/A',
      accountOpenedDate: acc.accountOpenedDate || 'N/A',
      accountCloseDate: acc.accountCloseDate || null,
      currentBalance: Number(acc.currentBalance ?? 0),
      overdue: Number(acc.overdue ?? 0),
      assetClassification: acc.assetClassification || null,
      emi: acc.emi ?? null,
      interestRate: acc.interestRate ?? null,
      paymentFrequency: acc.paymentFrequency || null,
      ownership: acc.ownership || 'N/A',
      writtenOff: acc.writtenOff || null,
      settlement: acc.settlement || null,
      sanctionedAmount: Number(acc.sanctionedAmount ?? acc.sanctionedAmountCreditLimit ?? acc.santionedamountCreditLimit ?? 0),
      delayCount: Number(acc.delayCount ?? acc.countofdelays ?? acc.countOfDelays ?? 0),
      reportedDate: acc.reportedDate ?? acc.reportedandCertified ?? 'N/A',
      tenure: acc.tenure ?? acc.repaymentTenure ?? null,
      loanType: acc.loanType || acc.accountType || 'Other'
    };
  };

  // Resolve accounts list based on payload format
  const segmentAccounts = useMemo(() => {
    let parsed: any[] = [];
    
    if (Array.isArray(accountsList)) {
      // Mock format (flat array)
      parsed = accountsList.filter((acc: any) => {
        const isClosed = activeSegment === 'Closed';
        const accStatus = String(acc.status || '').toLowerCase();
        return isClosed ? accStatus.includes('closed') : accStatus.includes('active');
      });
    } else if (typeof accountsList === 'object' && accountsList !== null) {
      // Real format (dictionary with activeAccounts and closedAccounts)
      const segmentKey = activeSegment === 'Active' ? 'activeAccounts' : 'closedAccounts';
      const segmentObj = accountsList[segmentKey] || {};
      
      // Gather all accounts from sub-categories (creditCard, personalLoan, autoLoan, etc.)
      Object.values(segmentObj).forEach((loanList: any) => {
        if (Array.isArray(loanList)) {
          loanList.forEach((acc: any) => {
            // Filter out dummy null accounts that ScoreMe uses as placeholders
            if (acc && (acc.lender || acc.accountNo)) {
              parsed.push(acc);
            }
          });
        }
      });
    }
    
    return parsed.map(normalizeAccount);
  }, [accountsList, activeSegment]);

  // Compute dynamic KPI totals based on segment accounts
  const totals = useMemo(() => {
    return segmentAccounts.reduce(
      (acc, curr) => ({
        sanctioned: acc.sanctioned + curr.sanctionedAmount,
        balance: acc.balance + curr.currentBalance,
        overdue: acc.overdue + curr.overdue,
      }),
      { sanctioned: 0, balance: 0, overdue: 0 }
    );
  }, [segmentAccounts]);

  // Group accounts by loanType
  const groupedAccounts = useMemo(() => {
    return segmentAccounts.reduce((acc: Record<string, any[]>, curr) => {
      const type = curr.loanType || 'Other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(curr);
      return acc;
    }, {});
  }, [segmentAccounts]);

  const toggleExpand = (id: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getAssetBadgeClass = (assetClass: string) => {
    const cls = String(assetClass || '').toLowerCase().trim();
    if (cls === 'standard' || cls === 'std') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (cls.includes('mention') || cls.includes('sma') || cls.includes('sub') || cls.includes('dbt')) {
      return 'bg-red-50 text-red-700 border-red-200 animate-pulse';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Segmented Controller (Tabs) */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-slate-100 p-1.5 border border-slate-200">
          {(['Active', 'Closed'] as const).map(segment => (
            <button
              key={segment}
              onClick={() => {
                setActiveSegment(segment);
                setExpandedAccounts({});
              }}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
                activeSegment === segment
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {segment} Accounts
            </button>
          ))}
        </div>
      </div>

      {/* KPI Sums at the top of segment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sanctioned limit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Credit Limit</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">
            {formatINR(totals.sanctioned)}
          </p>
        </div>
        
        {/* Outstanding debt */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Balance</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">
            {formatINR(totals.balance)}
          </p>
        </div>

        {/* Overdue Limit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Balance</span>
          <p className={`text-2xl font-extrabold mt-1 ${totals.overdue > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {formatINR(totals.overdue)}
          </p>
        </div>
      </div>

      {/* Grouped Accounts List */}
      <div className="space-y-6">
        {Object.keys(groupedAccounts).length > 0 ? (
          Object.entries(groupedAccounts).map(([loanType, accounts]) => {
            const typedAccounts = accounts as any[];
            return (
              <div key={loanType} className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  {loanType} ({typedAccounts.length})
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {typedAccounts.map((acc: any, index: number) => {
                    const uniqueId = `${acc.loanType}-${acc.accountNo}-${index}`;
                    const isExpanded = !!expandedAccounts[uniqueId];
                    const hasOverdue = Number(acc.overdue) > 0;
                    
                    return (
                      <div 
                        key={uniqueId} 
                        className={`overflow-hidden rounded-xl border transition-all ${
                          hasOverdue ? 'border-red-200 shadow-red-50/50 shadow-sm' : 'border-slate-200 shadow-sm'
                        } bg-white`}
                      >
                        {/* Main Summary Header */}
                        <div 
                          onClick={() => toggleExpand(uniqueId)}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4 cursor-pointer hover:bg-slate-50/50"
                        >
                          {/* Lender & Account info */}
                          <div className="flex items-start gap-3">
                            <div className={`rounded-lg p-2 mt-0.5 ${hasOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                              <Landmark className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{acc.lender}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                <span>Acct: <strong className="font-semibold text-slate-700">{acc.accountNo}</strong></span>
                                <span>•</span>
                                <span>Opened: <strong className="font-semibold text-slate-700">{acc.accountOpenedDate}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Balance and Badges column */}
                          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Current Balance</p>
                              <p className="font-bold text-slate-900">{formatINR(acc.currentBalance)}</p>
                            </div>
                            
                            {/* Overdue indicator */}
                            {hasOverdue && (
                              <div className="text-right pr-2">
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Overdue</p>
                                <p className="font-extrabold text-red-600">{formatINR(acc.overdue)}</p>
                              </div>
                            )}

                            {/* Asset classification */}
                            {acc.assetClassification && (
                              <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getAssetBadgeClass(acc.assetClassification)}`}>
                                {acc.assetClassification}
                              </span>
                            )}

                            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400 hidden md:block" /> : <ChevronDown className="h-5 w-5 text-slate-400 hidden md:block" />}
                          </div>
                        </div>

                        {/* Expandable details panel */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                            {/* Financials details */}
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5" /> Financials
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Sanctioned Amount:</span>
                                  <span className="font-bold text-slate-800">{formatINR(acc.sanctionedAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">EMI:</span>
                                  <span className="font-semibold text-slate-800">{acc.emi ? formatINR(acc.emi) : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Interest Rate:</span>
                                  <span className="font-semibold text-slate-800">{acc.interestRate ? `${acc.interestRate}%` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Payment Frequency:</span>
                                  <span className="font-semibold text-slate-800">{acc.paymentFrequency || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Term & Dates */}
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" /> Tenure & Dates
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Repayment Tenure:</span>
                                  <span className="font-semibold text-slate-800">{acc.tenure ? `${acc.tenure} Months` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Last Payment Date:</span>
                                  <span className="font-semibold text-slate-800">{acc.lastPaymentDate || 'N/A'}</span>
                                </div>
                                {acc.accountCloseDate && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 text-xs">Close Date:</span>
                                    <span className="font-bold text-slate-800">{acc.accountCloseDate}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Reported & Certified:</span>
                                  <span className="font-semibold text-slate-800">{acc.reportedDate}</span>
                                </div>
                              </div>
                            </div>

                            {/* Delay & Flags */}
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> Delay Track
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Ownership Type:</span>
                                  <span className="font-semibold text-slate-800">{acc.ownership}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Count of Delays:</span>
                                  <span className={`font-bold ${Number(acc.delayCount) > 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                    {acc.delayCount}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Written Off & Settlement */}
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" /> Resolution Details
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Written-Off Amt:</span>
                                  <span className="font-semibold text-slate-800">{acc.writtenOff || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 text-xs">Settlement Amt:</span>
                                  <span className="font-semibold text-slate-800">{acc.settlement || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-slate-400">
            <Info className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No accounts found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
