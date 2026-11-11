import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GstReportData, GstReportContent } from '@/types/gst-report';
import { Spinner } from '@/components/ui/spinner';

// Type for the GST/Cibil list item
interface GstCibilListItem {
  id: string;
  gstin: string;
  contact_number: string;
  name: string;
  reference_id: string;
  entity_status?: string;
  bureau_rating?: string;
  last_updated: string;
}

// Mock data function - replace with actual API call when ready
const fetchGstCibilData = async (accountId: string): Promise<GstCibilListItem[]> => {
  // TODO: Replace with actual API endpoint when backend is ready
  // For now, using a mock that transforms the provided data structure
  return [
    {
      id: '6ad77cb9a2df9a5045a1b337',
      gstin: '29AOZPA2367R1ZW',
      contact_number: '9980834987',
      name: 'QUADRI AGENCIES',
      reference_id: '452cf878-d42a-4ee8-b4e0-fdc6b32c2725',
      entity_status: 'Active',
      bureau_rating: 'CRIF: 732 / Experian: 745',
      last_updated: '20 October 2026, 14:37',
    },
  ];
};

export default function GstCibilPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<GstCibilListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get account ID from params - adjust based on your routing
  const accountId = 'some-account-id'; // TODO: Replace with actual params

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchGstCibilData(accountId);
        setData(result);
      } catch (err) {
        setError('Failed to load GST/Cibil data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [accountId]);

  const handleRowClick = (referenceId: string) => {
    // Navigate to detail page - update the path as needed
    navigate(`/gst-cibil-report/${referenceId}`);
  };

  const getStatusBadgeStyle = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-600 border-slate-200';
    const s = status.toLowerCase();
    if (s.includes('active')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (s.includes('inactive') || s.includes('cancelled')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <Spinner className='h-8 w-8' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-[60vh] flex-col gap-2'>
        <p className='text-red-600'>{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className='max-w-[1400px] mx-auto w-full animate-in fade-in zoom-in duration-300 px-4 py-4'>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' size='icon' onClick={() => navigate(-1)}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
            GST & Cibil Reports
          </h1>
          <p className='text-sm text-slate-500'>
            View GST registration and Cibil bureau reports
          </p>
        </div>
      </div>

      <Card className='border border-slate-200 shadow-sm'>
        <CardHeader className='bg-slate-50/50 border-b border-slate-200 px-6 py-4'>
          <CardTitle className='text-lg font-semibold'>Reports List</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {data.length === 0 ? (
            <div className='p-12 text-center text-slate-500'>
              <p>No GST/Cibil reports found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className='bg-slate-50 border-b border-slate-200'>
                <TableRow>
                  <TableHead className='w-32 px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    GSTIN
                  </TableHead>
                  <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Name
                  </TableHead>
                  <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Contact
                  </TableHead>
                  <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Status
                  </TableHead>
                  <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Bureau Rating
                  </TableHead>
                  <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Last Updated
                  </TableHead>
                  <TableHead className='px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='divide-y divide-slate-200'>
                {data.map((item) => (
                  <TableRow
                    key={item.id}
                    className='cursor-pointer hover:bg-slate-50 transition-colors'
                    onClick={() => handleRowClick(item.reference_id)}
                  >
                    <TableCell className='px-6 py-4 font-medium text-slate-900 font-mono text-sm'>
                      {item.gstin}
                    </TableCell>
                    <TableCell className='px-6 py-4 text-sm text-slate-700'>
                      {item.name}
                    </TableCell>
                    <TableCell className='px-6 py-4 text-sm text-slate-700'>
                      {item.contact_number}
                    </TableCell>
                    <TableCell className='px-6 py-4'>
                      <Badge
                        className={`${getStatusBadgeStyle(
                          item.entity_status
                        )} border rounded-full px-3 py-0.5 text-xs font-medium`}
                      >
                        {item.entity_status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className='px-6 py-4 text-sm text-slate-700'>
                      {item.bureau_rating || 'Not Available'}
                    </TableCell>
                    <TableCell className='px-6 py-4 text-sm text-slate-500'>
                      {item.last_updated}
                    </TableCell>
                    <TableCell className='px-6 py-4 text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item.reference_id);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
