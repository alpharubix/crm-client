import { useMemo } from 'react';
import { 
  User, Calendar, ShieldCheck, Mail, Briefcase, 
  IndianRupee, CreditCard, AlertOctagon, Landmark, 
  Search
} from 'lucide-react';
import type { CibilOverviewData } from '@/pages/cibil/api';

// Helper to format values
const formatINR = (val: unknown) => {
  if (val === null || val === undefined || val === '') return '₹0';
  const num = Number(val);
  return isNaN(num) ? String(val) : `₹${num.toLocaleString('en-IN')}`;
};

export default function OverviewTab({ data }: { data: CibilOverviewData }) {
  const cibilReport = data?.cibil_report?.EquifaxRetail || {};
  
  // Safe extraction of data parts
  const bureauAnalysis = (cibilReport as any).BureauAnalysis || {};
  const generalInfo = (cibilReport as any).generalInfo || {};
  
  // Dynamic extraction to support both mock and real ScoreMe API payloads
  const basicInfo = generalInfo.basicInfo || {};
  const name = basicInfo.name ?? generalInfo.name ?? 'N/A';
  const dob = basicInfo.dateOfBirth ?? generalInfo.dateOfBirth ?? 'N/A';
  const age = basicInfo.age ?? generalInfo.age ?? '';
  const gender = basicInfo.gender ?? generalInfo.gender ?? 'N/A';
  const email = basicInfo.email ?? generalInfo.email ?? 'N/A';
  
  const ident = generalInfo['identification(s)'] || {};
  const pan = ident.pan ?? generalInfo.pan ?? 'N/A';
  
  const empInfo = generalInfo.employmentInformation || {};
  const occupation = empInfo.occupation ?? generalInfo.occupation ?? 'N/A';
  const income = empInfo.salary ?? generalInfo.income ?? 0;

  // Bureau Summary Metrics
  const accSummary = generalInfo.accountsSummary || {};
  const totalAccounts = accSummary.totalAccounts ?? bureauAnalysis.totalAccounts ?? 0;
  const activeAccounts = accSummary.activeAccount ?? accSummary.activeAccounts ?? bureauAnalysis.activeAccounts ?? 0;
  const overdueAccounts = accSummary.overdueAccount ?? accSummary.overdueAccounts ?? bureauAnalysis.overdueAccounts ?? 0;
  const totalOverdueAmount = accSummary.totalOverdueAmount ?? bureauAnalysis.totalOverdueAmount ?? 0;
  const totalOutstandingBalance = accSummary.totalOutstandingBalance ?? bureauAnalysis.totalOutstandingBalance ?? 0;
  const maximumAmountSanctioned = accSummary.maximumamountSactioned ?? accSummary.maximumAmountSanctioned ?? bureauAnalysis.maximumAmountSanctioned ?? 0;
  const oldestAccountOpenDate = accSummary.oldestAccountOpenDate ?? bureauAnalysis.oldestAccountOpenDate ?? 'N/A';
  const recentAccountOpenDate = accSummary.recentAccountOpenDate ?? bureauAnalysis.recentAccountOpenDate ?? 'N/A';
  const totalAccountAsAGuarantor = accSummary.totalAccountasaGuarantor ?? accSummary.totalAccountAsAGuarantor ?? bureauAnalysis.totalAccountAsAGuarantor ?? 0;

  // Repayment / Obligation stats
  const oblig = generalInfo.repaymentObligations || {};
  const totalNoOfDpdsRecorded = oblig.totalnoofDPDsrecorded ?? oblig.totalNoOfDpdsRecorded ?? bureauAnalysis.totalNoOfDpdsRecorded ?? 0;
  const dpdsInActiveAccountsCount = oblig.dpdsinActiveAccounts ?? oblig.dpdsInActiveAccountsCount ?? bureauAnalysis.dpdsInActiveAccountsCount ?? 0;
  const highestDpdRecordedInActiveAccount = oblig.highestDPDrecordedinActiveAccount ?? oblig.highestDpdRecordedInActiveAccount ?? bureauAnalysis.highestDpdRecordedInActiveAccount ?? '000';
  const highestDpdRecordedOverall = oblig.highestDPDrecordedOverall ?? oblig.highestDpdRecordedOverall ?? bureauAnalysis.highestDpdRecordedOverall ?? '000';
  const totalWrittenOff = oblig['totalWritten-off'] ?? oblig.totalWrittenOff ?? bureauAnalysis.totalWrittenOff ?? 0;
  const totalSettlement = oblig.totalSettlement ?? bureauAnalysis.totalSettlement ?? 0;
  const totalNoOfSubStdRecorded = oblig.totalNoOfSUBSTDRecorded ?? oblig.totalNoOfSubStdRecorded ?? bureauAnalysis.totalNoOfSubStdRecorded ?? 0;

  // Lender details
  const lenderDetailsList = generalInfo.accountDetails ?? (cibilReport as any).lenderDetails ?? [];

  // Enquiries
  const enquiryData = generalInfo.enquiries ?? (cibilReport as any).enquiries ?? {};
  const totalEnquiries = enquiryData.totalEnquiries ?? 0;
  const recentDateOfEnquiry = enquiryData.recentDate ?? enquiryData.recentDateOfEnquiry ?? 'N/A';
  const enquiries30Days = enquiryData.past30Days ?? 0;
  const enquiries12Months = enquiryData.past12Months ?? 0;
  const enquiries24Months = enquiryData.past24Months ?? 0;

  // Account Type Distribution
  const accountTypeData = (generalInfo.accountType ?? (cibilReport as any).accountTypeDistribution) || {};
  const parsedDistribution = useMemo(() => {
    let list: any[] = [];
    if (typeof accountTypeData === 'object' && !Array.isArray(accountTypeData)) {
      Object.entries(accountTypeData).forEach(([key, val]: [string, any]) => {
        if (val && typeof val === 'object') {
          // camelCase/pascalCase to Title Case
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          list.push({
            accountType: label,
            totalAccounts: val.totalAccount ?? val.totalAccounts ?? 0,
            activeAccounts: val.activeAccount ?? val.activeAccounts ?? 0
          });
        }
      });
    } else if (Array.isArray(accountTypeData)) {
      list = accountTypeData;
    }
    return list;
  }, [accountTypeData]);

  // Extract score
  const score = Number(bureauAnalysis.score || 715);
  
  // Calculate score color and status
  const scoreMetrics = useMemo(() => {
    // Equifax score ranges from 300 to 900
    const percent = Math.max(0, Math.min(100, ((score - 300) / 600) * 100));
    let strokeColor = '#EF4444';
    let status = 'Poor';
    let description = 'High risk profile. Needs immediate improvement.';

    if (score >= 750) {
      strokeColor = '#10B981';
      status = 'Excellent';
      description = 'Superb credit profile. Excellent eligibility for loans.';
    } else if (score >= 700) {
      strokeColor = '#22C55E';
      status = 'Good';
      description = 'Healthy credit history. Very good loan approvals.';
    } else if (score >= 600) {
      strokeColor = '#F59E0B';
      status = 'Fair';
      description = 'Moderate risk profile. Some improvements needed.';
    }

    return { percent, strokeColor, status, description };
  }, [score]);

  return (
    <div className="space-y-6">
      {/* Score and Bureau Summary row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Visual Score Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-slate-50 opacity-50 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-slate-50 opacity-50 blur-2xl" />
          
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Bureau Score</h4>
          
          {/* Dial SVG */}
          <div className="relative flex flex-col items-center justify-center w-64 h-36 mt-4">
            <svg viewBox="0 0 256 144" className="w-full h-full">
              <defs>
                <linearGradient id="scoreRed" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#F87171" />
                </linearGradient>
                <linearGradient id="scoreOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
                <linearGradient id="scoreGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
              
              {/* Background segmented tracks */}
              {/* Red segment (300 to 600 - 50%) */}
              <path
                d="M 28 128 A 100 100 0 0 1 128 28"
                fill="none"
                stroke="#EF4444"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.15"
              />
              {/* Orange segment (600 to 700 - 16.6%) */}
              <path
                d="M 128 28 A 100 100 0 0 1 178 41.4"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.15"
              />
              {/* Green segment (700 to 900 - 33.3%) */}
              <path
                d="M 178 41.4 A 100 100 0 0 1 228 128"
                fill="none"
                stroke="#10B981"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.15"
              />

              {/* Active filled progress arc */}
              <path
                d="M 28 128 A 100 100 0 0 1 228 128"
                fill="#FFFFFF"
                stroke={score >= 700 ? "url(#scoreGreen)" : score >= 600 ? "url(#scoreOrange)" : "url(#scoreRed)"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="314.16"
                strokeDashoffset={314.16 - (314.16 * scoreMetrics.percent) / 100}
                className="transition-all duration-1000 ease-out"
              />

              {/* Needle/Pointer Group */}
              <g 
                style={{ 
                  transform: `rotate(${scoreMetrics.percent * 1.8}deg)`, 
                  transformOrigin: '128px 128px' 
                }} 
                className="transition-transform duration-1000 ease-out"
              >
                {/* <line x1="128" y1="128" x2="38" y2="128" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" /> */}
                <polygon points="38,128 48,124 48,132" fill="#1E293B" />
                {/* <circle cx="128" cy="128" r="2" fill="#a1833e" /> */}
              </g>
              {/* Center cap outer */}
              {/* <circle cx="128" cy="128" r="2" fill="#1E293B" opacity="0.9" /> */}
            </svg>
            
            {/* Centered Score text, placed nicely under the peak of the arc */}
            <div className="absolute bottom-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold tracking-tight ${
                score >= 700 ? 'text-emerald-500' : score >= 600 ? 'text-amber-500' : 'text-red-500'
              }`}>{score}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Equifax Score</span>
            </div>
          </div>

          <div className="mt-4">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              scoreMetrics.status === 'Excellent' ? 'bg-emerald-50 text-emerald-700' :
              scoreMetrics.status === 'Good' ? 'bg-green-50 text-green-700' :
              scoreMetrics.status === 'Fair' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
            }`}>
              {scoreMetrics.status}
            </span>
            <p className="mt-2 text-xs text-slate-500 max-w-xs">{scoreMetrics.description}</p>
          </div>
        </div>

        {/* Basic Info Cards */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Personal & Identification Profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Consumer Name */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Full Name</p>
                <p className="text-sm font-semibold text-slate-800">{name}</p>
              </div>
            </div>

            {/* Birth Date / Age */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date of Birth (Age)</p>
                <p className="text-sm font-semibold text-slate-800">
                  {dob} {age ? `(${age} Yrs)` : ''} {gender && gender !== 'N/A' ? `| ${gender}` : ''}
                </p>
              </div>
            </div>

            {/* PAN Number */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">PAN Number</p>
                <p className="text-sm font-bold tracking-wider text-slate-800 uppercase">{pan}</p>
              </div>
            </div>

            {/* Email Address */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email Address</p>
                <p className="text-sm font-semibold text-slate-800 truncate" title={email}>
                  {email}
                </p>
              </div>
            </div>

            {/* Employment / Occupation */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Occupation</p>
                <p className="text-sm font-semibold text-slate-800">{occupation}</p>
              </div>
            </div>

            {/* Declared Income */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-slate-600">
                <IndianRupee className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Annual Income</p>
                <p className="text-sm font-semibold text-slate-800">{formatINR(income)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-800">{totalAccounts}</span>
            <span className="text-xs font-medium text-slate-400">Accounts</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Accounts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-800">{activeAccounts}</span>
            <span className="text-xs font-semibold text-green-600">Active</span>
          </div>
        </div>

        {/* Overdue Accounts */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Accounts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-bold ${Number(overdueAccounts) > 0 ? 'text-red-600' : 'text-slate-800'}`}>{overdueAccounts}</span>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Overdue</span>
          </div>
        </div>

        {/* Total Overdue Amount */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Overdue Amount</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-bold ${Number(totalOverdueAmount) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {formatINR(totalOverdueAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Balance, Sanctioned, etc.) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Balance */}
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/95">
              Outstanding Debt
            </span>
            <p className="mt-3 text-3xl font-extrabold tracking-tight">
              {formatINR(totalOutstandingBalance)}
            </p>
          </div>
          <span className="mt-4 text-[10px] font-semibold text-white/50 uppercase tracking-wide">
            Total Outstanding Balance
          </span>
        </div>

        {/* Max Sanctioned Amount */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center rounded bg-slate-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Credit Limit
            </span>
            <p className="mt-3 text-3xl font-extrabold text-slate-800 tracking-tight">
              {formatINR(maximumAmountSanctioned)}
            </p>
          </div>
          <span className="mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Maximum Amount Sanctioned
          </span>
        </div>

        {/* Dates card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Oldest Open Date</p>
              <p className="mt-1.5 text-lg font-bold text-slate-800">{oldestAccountOpenDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Recent Open Date</p>
              <p className="mt-1.5 text-lg font-bold text-slate-800">{recentAccountOpenDate}</p>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Accounts as Guarantor</span>
            <span className="font-semibold text-slate-900">{totalAccountAsAGuarantor}</span>
          </div>
        </div>
      </div>

      {/* Lenders & Obligations Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lenders Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Landmark className="h-5 w-5 text-slate-700" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Lender Distribution
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-2">Lender</th>
                  <th className="pb-2 text-center">Accounts</th>
                  <th className="pb-2 text-right">Sanctioned Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lenderDetailsList.length > 0 ? (
                  lenderDetailsList.map((item: any, idx: number) => {
                    const accountsCount = item.noofAccounts ?? item.noOfAccounts ?? 1;
                    const amt = item.totalAmountSanctioned ?? item.totalAmountSanctioned ?? 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-semibold text-slate-800 pr-3 max-w-xs truncate">{item.lender}</td>
                        <td className="py-2.5 text-center text-slate-600 font-semibold">{accountsCount}</td>
                        <td className="py-2.5 text-right font-bold text-slate-800">{formatINR(amt)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-slate-400">No lender details returned.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Obligations Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <AlertOctagon className="h-5 w-5 text-slate-700" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Repayment & Obligations
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Metric Box */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total DPDs Recorded</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-800">{totalNoOfDpdsRecorded}</p>
            </div>
            
            {/* Metric Box */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">DPDs in Active Accounts</span>
              <p className={`mt-1 text-2xl font-extrabold ${Number(dpdsInActiveAccountsCount) > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                {dpdsInActiveAccountsCount}
              </p>
            </div>

            {/* Metric Box */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Highest DPD in Active Account</span>
              <p className="mt-1 text-xl font-extrabold text-slate-800">{highestDpdRecordedInActiveAccount || '000'}</p>
            </div>

            {/* Metric Box */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Highest DPD Overall</span>
              <p className="mt-1 text-xl font-extrabold text-slate-800">{highestDpdRecordedOverall || '000'}</p>
            </div>
          </div>

          {/* Quick flags list */}
          <div className="mt-5 border-t border-slate-100 pt-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="border-r border-slate-100 pr-2">
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">Written-off</span>
              <span className={`mt-1 block font-bold ${Number(totalWrittenOff) > 0 ? 'text-red-500' : 'text-slate-700'}`}>
                {totalWrittenOff}
              </span>
            </div>
            <div className="border-r border-slate-100 pr-2">
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">Settlements</span>
              <span className={`mt-1 block font-bold ${Number(totalSettlement) > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                {totalSettlement}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">Sub-Standard</span>
              <span className="mt-1 block font-bold text-slate-700">
                {totalNoOfSubStdRecorded}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiries & Account Types Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Account Types Distribution */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <CreditCard className="h-5 w-5 text-slate-700" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Account Types Breakdown
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parsedDistribution.length > 0 ? (
              parsedDistribution
                .filter((item: any) => Number(item.totalAccounts) > 0)
                .map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="font-semibold text-slate-800 text-xs">{item.accountType}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">Total: <strong className="text-slate-700 font-bold">{item.totalAccounts}</strong></span>
                      {Number(item.activeAccounts) > 0 && (
                        <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                          {item.activeAccounts} Active
                        </span>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-xs text-slate-400 col-span-2 py-4 text-center">No distribution data available.</p>
            )}
          </div>
        </div>

        {/* Enquiries Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Search className="h-5 w-5 text-slate-700" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Bureau Enquiries
            </h4>
          </div>

          <div className="text-center py-4 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Credit Enquiries</span>
            <p className="text-4xl font-extrabold text-slate-900 mt-1">{totalEnquiries}</p>
            <p className="text-xs text-slate-500 mt-2">Recent Enquiry: <strong>{recentDateOfEnquiry}</strong></p>
          </div>

          {/* Enquiry Timeframe stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400">Past 30d</span>
              <span className="mt-1 block font-bold text-slate-800 text-sm">{enquiries30Days}</span>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400">Past 12m</span>
              <span className="mt-1 block font-bold text-slate-800 text-sm">{enquiries12Months}</span>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400">Past 24m</span>
              <span className="mt-1 block font-bold text-slate-800 text-sm">{enquiries24Months}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
