import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useNavigate } from 'react-router-dom'

import type { Deal } from '@/types'
import { formatExactDate } from '@/utils/date-formatter'

const DealsData: Deal[] = [
  {
    id: 1,
    account_name: 'Pradeep Traders',
    stage: 'Yet to Lender Login',
    amount: '50,00,000.00',
    lender: 'Kotak Mahindra Bank Ltd',
    closing_date: '2025-12-12T14:07:37.194785+05:30',
    deal_owner: 'Ashok',
    last_activity_time: '2025-12-12T14:07:37.194785+05:30',
  },
]

const DealsPage = () => {
  const navigate = useNavigate()

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals Database</h1>
          <p className="text-muted-foreground">
            Manage your potential deals here.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Refresh Button */}
          <Button variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4`} />
          </Button>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="border rounded-md p-2">
        <Table>
          <TableCaption>A list of recent deals.</TableCaption>
          <TableHeader>
            <TableRow>
              {/* <TableHead className="w-[50px]">ID</TableHead> */}
              <TableHead>Deals Details</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Closing Date</TableHead>
              <TableHead>Deal Owner</TableHead>
              <TableHead>Last Activity Time</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DealsData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No deals found. Add one!
                </TableCell>
              </TableRow>
            ) : (
              DealsData.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigate(`/update-deals`)}
                >
                  {/* <TableCell className="font-medium">{deal.id}</TableCell> */}
                  <TableCell className="font-medium">
                    <div className="text-lg">{deal.lender}</div>
                    <div className="text-sm text-muted-foreground">
                      Account Name: {deal.account_name || 'Individual'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-md inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {deal.stage}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-md">
                      {formatExactDate(deal.closing_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-md">
                      {deal.deal_owner}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-md">
                      {formatExactDate(deal.last_activity_time)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg font-semibold">
                      Rs. {deal.amount}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default DealsPage
