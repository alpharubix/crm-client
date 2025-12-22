import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table'
import { formatDateExact } from '@/utils/dateFormatter'
import type { Lead } from '@/types'

type Props = {
  leads: Lead[]
  loading: boolean
}

export default function LeadsTable({ leads, loading }: Props) {

  console.log("LeadsTable", leads);
  
  const navigate = useNavigate()

  return (
    <div className="border rounded-md p-2">
      <Table>
        <TableCaption>A list of recent leads.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {leads.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => navigate(`/leads/${lead.id}`)}
              >
                <TableCell>{lead.id}</TableCell>
                <TableCell>{lead.full_name}</TableCell>
                <TableCell>
                  {lead.email}
                  <div className="text-xs">{lead.phone_number}</div>
                </TableCell>
                <TableCell>
                  PAN: {lead.pan || '-'}
                  <br />
                  GST: {lead.gstin || '-'}
                </TableCell>
                <TableCell>{formatDateExact(lead.created_at)}</TableCell>
                <TableCell>{lead.business_status || 'New'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
