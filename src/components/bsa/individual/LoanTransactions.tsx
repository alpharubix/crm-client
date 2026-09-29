import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';
import BankAccountDetails from '../BankAccountDetails';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ENV } from '@/conf';

interface SummaryLoanTranx {
  month: string;
  Debit: number | null;
  Credit: number | null;
}

interface DetailLoanTranx {
  date: string;
  particulars: string;
  Debit: number | null;
  Credit: number | null;
}

interface LoanTransactionData {
  summary_of_loan_trans: SummaryLoanTranx[];
  details_of_loan_transaction: DetailLoanTranx[];
}

export default function IndividualLoanTransactions({
  accountNumber: propAccountNumber,
  acc_id: propAccId,
}: { accountNumber?: string; acc_id?: string | number } = {}) {
  const { id } = useParams();
  const acc_id = propAccId || id;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedAccountNumber =
    propAccountNumber ||
    (location.state as { accountNumber?: string } | null)?.accountNumber ||
    sessionStorage.getItem('selected_bsa_account_number') ||
    '';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['individual-loan-transactions', acc_id, selectedAccountNumber],
    queryFn: async () => {
      const response = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/individual/r1x-loan-transactions/${acc_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_number: selectedAccountNumber,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Failed to load loan transactions. Please try again.');
      }
      const json = await response.json();
      const docs = json.data;
      if (docs && docs.length > 0) {
        return docs[0] as LoanTransactionData;
      }
      return null;
    },
    enabled: !!selectedAccountNumber && !!acc_id,
  });

  const formatCurrency = (value: number | string | undefined | null) => {
    if (value === undefined || value === null || value === '' || value === '-')
      return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  return (
    <div className="p-8 animate-fade-in relative min-h-[calc(100vh-4rem)] bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Loan Transactions
          </h1>
          <p className="text-gray-600">
            Summary and details of loan transactions
          </p>
        </div>
      </div>

      <BankAccountDetails />

      {!selectedAccountNumber && (
        <Card className="mb-8 shadow-sm border-black/10 bg-white">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-gray-600">
              Please select a bank account before opening this report.
            </p>
            <Button
              type="button"
              onClick={() => {
                if (searchParams.get('bsaView')) {
                  searchParams.delete('bsaView');
                  searchParams.delete('accountNumber');
                  setSearchParams(searchParams);
                } else {
                  navigate('/bsa/bank-accounts');
                }
              }}
              className="mt-4 bg-[#002366] hover:bg-[#001744] text-white"
            >
              Back to Bank Accounts
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedAccountNumber && (
        <Card className="shadow-lg border-black/10 bg-white mb-8">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4">
            <div>
              <CardTitle className="text-xl text-black">
                Summary of Loan Transactions
              </CardTitle>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 border-black text-black hover:bg-gray-100"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
                <p>Loading summary data...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                <p>
                  Error loading data:{' '}
                  {(error as any)?.message || 'Unknown error'}
                </p>
              </div>
            ) : data?.summary_of_loan_trans &&
              data.summary_of_loan_trans.length > 0 ? (
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-sm text-left border-collapse border border-gray-300">
                  <thead className="text-xs text-white bg-[#002366]">
                    <tr>
                      <th className="px-4 py-3 font-semibold border border-gray-400">
                        Month
                      </th>
                      <th className="px-4 py-3 font-semibold text-right border border-gray-400">
                        Debit
                      </th>
                      <th className="px-4 py-3 font-semibold text-right border border-gray-400">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {data.summary_of_loan_trans.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-100 transition-colors"
                      >
                        <td className="px-4 py-2 border border-gray-300">
                          {row.month}
                        </td>
                        <td className="px-4 py-2 text-right border border-gray-300">
                          {formatCurrency(row.Debit)}
                        </td>
                        <td className="px-4 py-2 text-right border border-gray-300">
                          {formatCurrency(row.Credit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No summary data available.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedAccountNumber && (
        <Card className="shadow-lg border-black/10 bg-white">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4">
            <div>
              <CardTitle className="text-xl text-black">
                Details of Loan Transactions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
                <p>Loading details data...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                <p>
                  Error loading data:{' '}
                  {(error as any)?.message || 'Unknown error'}
                </p>
              </div>
            ) : data?.details_of_loan_transaction &&
              data.details_of_loan_transaction.length > 0 ? (
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-sm text-left border-collapse border border-gray-300">
                  <thead className="text-xs text-white bg-[#002366]">
                    <tr>
                      <th className="px-4 py-3 font-semibold border border-gray-400">
                        Date
                      </th>
                      <th className="px-4 py-3 font-semibold border border-gray-400">
                        Particulars
                      </th>
                      <th className="px-4 py-3 font-semibold text-right border border-gray-400">
                        Debit
                      </th>
                      <th className="px-4 py-3 font-semibold text-right border border-gray-400">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {data.details_of_loan_transaction.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-100 transition-colors"
                      >
                        <td className="px-4 py-2 border border-gray-300">
                          {row.date}
                        </td>
                        <td className="px-4 py-2 border border-gray-300">
                          {row.particulars}
                        </td>
                        <td className="px-4 py-2 text-right border border-gray-300">
                          {formatCurrency(row.Debit)}
                        </td>
                        <td className="px-4 py-2 text-right border border-gray-300">
                          {formatCurrency(row.Credit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No details data available.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
