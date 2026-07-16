import { useMemo } from 'react';
import { TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import type { CibilAnalysisData } from '@/pages/cibil/api';

export default function AnalysisTab({ data }: { data: CibilAnalysisData }) {
  const cibilReport = data?.cibil_report?.EquifaxRetail || {};
  const analysisData = (cibilReport as any).ScoremeAnalysis || {};
  const generalInfo = (cibilReport as any).generalInfo || {};
  const bureauAnalysis = (cibilReport as any).BureauAnalysis || {};
  
  // Extract list of loan analyses supporting both mock array and real dict format
  const loanTypes = useMemo(() => {
    let parsed: any[] = [];
    
    // In mock format, cibilReport.ScoremeAnalysis.loanTypesAnalysis is a list
    const mockList = analysisData.loanTypesAnalysis;

    if (Array.isArray(mockList)) {
      parsed = mockList;
    } else if (typeof analysisData === 'object' && analysisData !== null) {
      // In real format, analysisData itself is the dictionary of loan types
      Object.entries(analysisData).forEach(([loanType, val]: [string, any]) => {
        // Exclude comments key just in case, and verify value is an object
        if (loanType !== 'comments' && val && typeof val === 'object') {
          parsed.push({
            loanType,
            frequency: val.FrequencyofCreditFacilitytaken ?? val.frequency ?? '-',
            frequencyLast12Months: val.frequencyofCreditFacilitytakeninlast12months ?? val.frequencyLast12Months ?? '-',
            delayedActive: val.percentofdelayinActiveAccount ?? val.delayedActive ?? '-',
            delayedClosed: val.percentofdelayinClosedAccount ?? val.delayedClosed ?? '-',
            delayedTotal: val.percentofdelaytotal ?? val.delayedTotal ?? '-',
            delayedLast12Months: val.percentofdelayinlast12months ?? val.delayedLast12Months ?? '-',
            changeLast12Months: val.changeindefaultinlast12months ?? val.changeLast12Months ?? '-',
          });
        }
      });
    }

    // Sort to place "total" at the very bottom if it exists
    parsed.sort((a, b) => {
      const aLower = String(a.loanType).toLowerCase();
      const bLower = String(b.loanType).toLowerCase();
      if (aLower === 'total') return 1;
      if (bLower === 'total') return -1;
      return aLower.localeCompare(bLower);
    });

    return parsed;
  }, [analysisData]);

  // Generate comments dynamically if none exist in backend response
  const comments = useMemo(() => {
    const rawComments = analysisData.comments || [];
    const list = [...rawComments];

    if (list.length === 0) {
      const totalOverdue = Number(generalInfo.accountsSummary?.totalOverdueAmount ?? 0);
      const totalOutstanding = Number(generalInfo.accountsSummary?.totalOutstandingBalance ?? 0);
      const scoreVal = Number(bureauAnalysis.score || 715);
      
      if (scoreVal < 700) {
        list.push({
          title: "Credit Score Warning",
          description: `Bureau score of ${scoreVal} is below the optimal threshold of 750. Higher lending rates may apply.`
        });
      } else {
        list.push({
          title: "Healthy Credit Score",
          description: `Bureau score of ${scoreVal} indicates a low default probability and good credit health.`
        });
      }

      if (totalOverdue > 0) {
        list.push({
          title: "Active Defaults Detected",
          description: `Total overdue amount of ₹${totalOverdue.toLocaleString('en-IN')} across active accounts. Action recommended.`
        });
      } else if (totalOutstanding > 0) {
        list.push({
          title: "Outstanding Credit Utilisation",
          description: `Outstanding credit balance of ₹${totalOutstanding.toLocaleString('en-IN')} currently being serviced.`
        });
      }

      const totalEnquiries = Number(generalInfo.enquiries?.totalEnquiries ?? 0);
      if (totalEnquiries > 2) {
        list.push({
          title: "High Enquiry Frequency",
          description: `A total of ${totalEnquiries} credit enquiries recorded. Multiple inquiries in short periods can signal credit hunger.`
        });
      }
    }

    return list;
  }, [analysisData, generalInfo, bureauAnalysis]);

  return (
    <div className="space-y-6">
      {/* Analysis Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <TrendingUp className="h-5 w-5 text-slate-700" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            Credit Facility & Delays Analysis
          </h4>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead>
              {/* Row 1 Headers */}
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th rowSpan={3} className="px-4 py-3 align-middle">Loan Type</th>
                <th rowSpan={3} className="px-4 py-3 align-middle text-center max-w-[120px]">Total Facilities</th>
                <th rowSpan={3} className="px-4 py-3 align-middle text-center max-w-[120px]">Facilities in Last 12m</th>
                <th colSpan={4} className="px-4 py-1.5 text-center border-b border-slate-200">Delayed Payment Percentage</th>
                <th rowSpan={3} className="px-4 py-3 align-middle text-center max-w-[120px]">Default Change Last 12m</th>
              </tr>
              {/* Row 2 Headers */}
              <tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th colSpan={3} className="px-2 py-1 text-center border-r border-slate-200">Overall Track</th>
                <th rowSpan={2} className="px-2 py-1 text-center align-middle">Last 12m</th>
              </tr>
              {/* Row 3 Headers */}
              <tr className="bg-slate-50 text-[8px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="px-2 py-1 text-center border-r border-slate-100">Active</th>
                <th className="px-2 py-1 text-center border-r border-slate-100">Closed</th>
                <th className="px-2 py-1 text-center border-r border-slate-200">Total</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {loanTypes.length > 0 ? (
                loanTypes.map((row: any, idx: number) => {
                  const isTotalRow = String(row.loanType).toLowerCase().trim() === 'total';
                  const activeDelay = String(row.delayedActive || '').replace('%', '').trim();
                  const totalDelay = String(row.delayedTotal || '').replace('%', '').trim();
                  
                  // Highlight red if delays exist
                  const hasDelays = (activeDelay && Number(activeDelay) > 0) || (totalDelay && Number(totalDelay) > 0);

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/50 ${
                        isTotalRow ? 'bg-slate-50/80 font-bold border-t-2 border-slate-200' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.loanType}</td>
                      <td className="px-4 py-3 text-center text-slate-600 font-medium">{row.frequency || '-'}</td>
                      <td className="px-4 py-3 text-center text-slate-600 font-medium">{row.frequencyLast12Months || '-'}</td>
                      
                      {/* Delayed payment cols */}
                      <td className={`px-2 py-3 text-center font-bold ${
                        hasDelays && activeDelay ? 'text-red-500 bg-red-50/20' : 'text-slate-600'
                      }`}>
                        {row.delayedActive || '-'}
                      </td>
                      <td className="px-2 py-3 text-center text-slate-600 font-medium">{row.delayedClosed || '-'}</td>
                      <td className={`px-2 py-3 text-center font-bold ${
                        hasDelays && totalDelay ? 'text-red-500 bg-red-50/20' : 'text-slate-600'
                      }`}>
                        {row.delayedTotal || '-'}
                      </td>
                      <td className="px-2 py-3 text-center text-slate-600 font-medium">{row.delayedLast12Months || '-'}</td>
                      
                      <td className="px-4 py-3 text-center text-slate-600 font-medium">{row.changeLast12Months || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-xs text-slate-400">No analysis rows returned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments & Insights Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <MessageSquare className="h-5 w-5 text-slate-700" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            Credit Insights & Comments
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comments.length > 0 ? (
            comments.map((comment: any, idx: number) => {
              const isDefaultWarning = String(comment.title).toLowerCase().includes('default') || String(comment.title).toLowerCase().includes('warning');
              return (
                <div 
                  key={idx} 
                  className={`rounded-xl border p-4 flex gap-3 ${
                    isDefaultWarning 
                      ? 'border-red-100 bg-red-50/30 text-red-950' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-900'
                  }`}
                >
                  <div className={`rounded-lg p-2 shrink-0 h-10 w-10 flex items-center justify-center ${
                    isDefaultWarning ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isDefaultWarning ? <AlertCircle className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm leading-snug">{comment.title}</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{comment.description}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 col-span-2 py-4 text-center">No commentary generated for this report.</p>
          )}
        </div>
      </div>
    </div>
  );
}
