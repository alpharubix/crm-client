import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Tile from '@/components/ui/tile';
import { ENV } from '@/conf';
import { useParams } from 'react-router-dom';

function BankAccountDetails({
  acc_id: propAccId,
  accountNumber: propAccountNumber,
}: {
  acc_id?: string | number;
  accountNumber?: string;
} = {}) {
  const { id } = useParams();
  const accId = propAccId || id;
  const selectedAccountNumber =
    propAccountNumber ||
    sessionStorage.getItem('selected_bsa_account_number') ||
    '';

  const { data: accountDetails, isLoading } = useQuery({
    queryKey: ['accountDetails', accId, selectedAccountNumber],
    queryFn: async () => {
      if (!selectedAccountNumber || !accId) return null;
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1x-account-details/${accId}`,
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
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.account_details;
    },
    enabled: !!selectedAccountNumber && !!accId,
  });

  if (isLoading) return null;
  if (!accountDetails) return null;

  const entries = Object.entries(accountDetails);

  const isOpening = (key: string) =>
    key.toLowerCase().includes('open') && key.toLowerCase().includes('bal');
  const isClosing = (key: string) =>
    key.toLowerCase().includes('clos') && key.toLowerCase().includes('bal');

  const normalTiles = entries.filter(
    ([key]) => !isOpening(key) && !isClosing(key)
  );
  const openingBalance = entries.find(([key]) => isOpening(key));
  const closingBalance = entries.find(([key]) => isClosing(key));

  return (
    <Card className="mx-auto shadow-sm border border-gray-300">
      <CardHeader>
        <CardTitle className="text-xl text-[#000080]/60">
          Account Details
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* First 8 tiles */}
        <div className="grid grid-cols-4 gap-4">
          {normalTiles.map(([key, value]) => (
            <Tile key={key} title={key} value={String(value)} />
          ))}
        </div>

        {/* Third row */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {openingBalance && (
            <Tile
              className="col-span-2"
              title={openingBalance[0]}
              value={String(openingBalance[1])}
            />
          )}

          {closingBalance && (
            <Tile
              className="col-span-2"
              title={closingBalance[0]}
              value={String(closingBalance[1])}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BankAccountDetails;
