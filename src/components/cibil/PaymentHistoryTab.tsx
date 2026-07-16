import { useState } from 'react';
import { Calendar, Landmark, Info } from 'lucide-react';
import type { CibilPaymentHistoryData } from '@/pages/cibil/api';

// Helper to format values
const formatINR = (val: unknown) => {
  if (val === null || val === undefined || val === '') return '₹0';
  const num = Number(val);
  return isNaN(num) ? String(val) : `₹${num.toLocaleString('en-IN')}`;
};

const glossaryItems = [
  { code: '000', label: 'No Delays', desc: 'Payments are being timely made with zero days past due.', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { code: 'XXX', label: 'Not Reported', desc: 'Payment information has not been reported to CIBIL by the lender.', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  { code: 'STD', label: 'Standard Account', desc: 'Payments are being made within 90 days of due date.', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { code: 'NEW', label: 'New Account', desc: 'The credit facility was opened during this month.', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { code: '01+', label: 'Overdue DPD', desc: 'Represents days past due (e.g. 01+, 30, 90 days late).', color: 'bg-red-50 text-red-700 border-red-200' },
  { code: 'SPM / SMA', label: 'Special Mention', desc: 'Special Mention Account showing early signs of distress.', color: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold animate-pulse' },
  { code: 'CLSD', label: 'Closed Account', desc: 'The credit account has been closed by the lender.', color: 'bg-slate-200 text-slate-600 border-slate-300 font-semibold' },
];

export default function PaymentHistoryTab({ data }: { data: CibilPaymentHistoryData }) {
  const [historySegment, setHistorySegment] = useState<'Active' | 'Closed'>('Active');
  const cibilReport = data?.cibil_report?.EquifaxRetail || {};
  
  const activeTracks = (cibilReport as any).activeAccountRepaymentTrack || [];
  const closedTracks = (cibilReport as any).closedAccountRepaymentTrack || [];
  const selectedTracks = (historySegment === 'Active' ? activeTracks : closedTracks) as any[];

  // Helper to color monthly cell block
  const getCellColor = (trackVal: string) => {
    if (!trackVal || trackVal === '-') return 'bg-slate-50 text-slate-300 border-slate-100';
    const lower = trackVal.toLowerCase();
    
    // Split trackVal (e.g., '000/XXX', 'NEW/XXX', '01+/SPM', 'STD/STD', 'CLSD/XXX')
    const parts = lower.split('/');
    const dpd = parts[0] || '';
    const asset = parts[1] || '';

    if (dpd === 'clsd') {
      return 'bg-slate-200 text-slate-600 border-slate-300 font-semibold';
    }
    if (dpd === 'new') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (dpd === '000' && (asset === 'xxx' || asset === '')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (dpd.match(/^[1-9]/) || dpd.includes('+') || asset.includes('spm') || asset.includes('sma') || asset.includes('sub') || asset.includes('dbt')) {
      return 'bg-red-50 text-red-700 border-red-200 font-semibold shadow-sm';
    }
    if (dpd === 'std' || asset === 'std') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (dpd === 'xxx') {
      return 'bg-slate-100 text-slate-400 border-slate-200';
    }

    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

  // Resolve month values dynamically from the row object (handles case mismatch e.g., 'Jan' vs 'jan', 'Jun' vs 'june')
  const getMonthValue = (row: any, monthName: string) => {
    const m = monthName.toLowerCase();
    
    // Exact casing matches
    if (row[monthName] !== undefined && row[monthName] !== null) return String(row[monthName]);
    if (row[m] !== undefined && row[m] !== null) return String(row[m]);
    
    // Custom variations
    if (m === 'jun' || m === 'june') return String(row.Jun ?? row.jun ?? row.june ?? '-');
    if (m === 'jul' || m === 'july') return String(row.Jul ?? row.jul ?? row.july ?? '-');
    if (m === 'sept' || m === 'sep') return String(row.Sept ?? row.sep ?? row.sept ?? '-');
    
    return '-';
  };

  return (
    <div className="space-y-6">
      {/* Segment switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-slate-100 p-1.5 border border-slate-200">
          {(['Active', 'Closed'] as const).map(segment => (
            <button
              key={segment}
              onClick={() => setHistorySegment(segment)}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
                historySegment === segment
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {segment} Timeline
            </button>
          ))}
        </div>
      </div>

      {/* Repayment Timelines List */}
      <div className="space-y-6">
        {selectedTracks.length > 0 ? (
          selectedTracks.map((track: any, idx: number) => {
            const history = track.paymentStatus || track.repaymentHistory || [];
            
            const loanType = track.loanType || track.accountType || 'Account';
            const accNo = track.accountNo || 'N/A';
            const limit = track.sanctionedAmount ?? track.sanctionedAmountCreditLimit ?? track.santionedamountCreditLimit ?? 0;
            const date = track.date ?? track.reportedDate ?? track.reportedandCertified ?? 'N/A';

            return (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                {/* Header card for the account */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-50 p-2 text-slate-700">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{loanType}</h4>
                      <p className="text-xs text-slate-500">Acct No: <strong className="font-semibold text-slate-700">{accNo}</strong></p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Limit:</span>
                      <strong className="ml-1.5 font-bold text-slate-800">{formatINR(limit)}</strong>
                    </div>
                    <div className="hidden md:block text-slate-200">|</div>
                    <div>
                      <span className="text-slate-400">{historySegment === 'Active' ? 'Reported Date:' : 'Closed Date:'}</span>
                      <strong className="ml-1.5 font-semibold text-slate-800">{date}</strong>
                    </div>
                  </div>
                </div>

                {/* Timeline Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-[800px] space-y-2">
                    {/* Months header */}
                    <div 
                      className="gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1"
                      style={{ display: 'grid', gridTemplateColumns: '100px repeat(12, minmax(0, 1fr))' }}
                    >
                      <div className="text-left font-semibold pl-2">Year</div>
                      {months.map(m => <div key={m}>{m}</div>)}
                    </div>

                    {/* Timeline rows */}
                    {history.length > 0 ? (
                      history.map((row: any, rIdx: number) => (
                        <div 
                          key={rIdx} 
                          className="gap-2 items-center text-center"
                          style={{ display: 'grid', gridTemplateColumns: '100px repeat(12, minmax(0, 1fr))' }}
                        >
                          <div className="text-left text-sm font-bold text-slate-950 flex items-center gap-1.5 pl-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {row.year}
                          </div>
                          {months.map(m => {
                            const val = getMonthValue(row, m);
                            const isEmpty = !val || val === '-';
                            return (
                              <div
                                key={m}
                                className={`rounded-lg border py-2 text-xs font-semibold select-none flex flex-col justify-center items-center h-10 transition-colors ${getCellColor(val)}`}
                                title={val ? `Status: ${val}` : 'No records'}
                              >
                                {isEmpty ? (
                                  <span className="text-slate-300">-</span>
                                ) : (
                                  <span className="leading-tight truncate max-w-full px-0.5">{val}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">No repayment history records returned.</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-slate-400">
            <Info className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No payment history records found.</p>
          </div>
        )}
      </div>

      {/* Visual Glossary / Appendix Legend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 mb-4">
          CIBIL Legend & Abbreviations
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {glossaryItems.map((item, idx) => (
            <div key={idx} className="flex gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/50">
              <span className={`inline-flex items-center justify-center rounded-lg border h-10 w-16 text-xs font-bold shrink-0 ${item.color}`}>
                {item.code}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-800">{item.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
