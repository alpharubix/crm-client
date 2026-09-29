import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BankAccountsPage from '@/components/bsa/BankAccountsPage';
import SummeryOfDebitAndCredit from '@/components/bsa/summary-of-debit-and-credit/SummeryOfDebitAndCredit';
import CashFlow from '@/components/bsa/cashFlow/CashFlow';
import OverviewMonthlyWise from '@/components/bsa/overview-monthly-wise/OverviewMonthlyWise';
import IndividualOverview from '@/components/bsa/individual/Overview';
import IndividualEodAnalysis from '@/components/bsa/individual/EodAnalysis';
import IndividualLoanTransactions from '@/components/bsa/individual/LoanTransactions';

export default function BsaAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const bsaView = searchParams.get('bsaView');
  const accountNumber =
    searchParams.get('accountNumber') ||
    sessionStorage.getItem('selected_bsa_account_number') ||
    '';

  if (!id) return null;

  return (
    <div className='max-w-[1400px] mx-auto w-full animate-in fade-in zoom-in duration-300 px-4 py-4'>
      {!bsaView ? (
        <>
          <div className='flex items-center gap-4 mb-4'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => navigate(`/accounts/${id}`)}
            >
              <ArrowLeft className='h-5 w-5' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                Bank Statement Analysis
              </h1>
              <p className='text-sm text-slate-500'>
                BSA account details and available reports for this account.
              </p>
            </div>
          </div>
          <BankAccountsPage custId={id} hideHeader={true} isAnchor={true} />
        </>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Button
              variant='outline'
              onClick={() => {
                searchParams.delete('bsaView');
                searchParams.delete('accountNumber');
                setSearchParams(searchParams);
              }}
              className='flex items-center gap-2 border-[#002366] text-[#002366] hover:bg-[#002366]/5 font-semibold rounded-lg h-9 text-xs cursor-pointer'
            >
              <ArrowLeft className='h-4 w-4' /> Back to Bank Accounts
            </Button>

            {accountNumber && (
              <span className='text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md'>
                Account Number: {accountNumber}
              </span>
            )}
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] overflow-hidden p-6'>
            {bsaView === 'individual_overview' && (
              <IndividualOverview accountNumber={accountNumber} acc_id={id} />
            )}
            {bsaView === 'individual_eod' && (
              <IndividualEodAnalysis
                accountNumber={accountNumber}
                acc_id={id}
              />
            )}
            {bsaView === 'individual_loan' && (
              <IndividualLoanTransactions
                accountNumber={accountNumber}
                acc_id={id}
              />
            )}
            {bsaView === 'summary' && (
              <SummeryOfDebitAndCredit
                acc_id={id}
                accountNumber={accountNumber}
              />
            )}
            {bsaView === 'cashflow' && (
              <CashFlow acc_id={id} accountNumber={accountNumber} />
            )}
            {bsaView === 'overview' && (
              <OverviewMonthlyWise acc_id={id} accountNumber={accountNumber} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
