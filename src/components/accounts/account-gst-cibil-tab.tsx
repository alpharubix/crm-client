import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Search,
  Copy,
  Check,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ENV } from '@/conf';
import { formatCreationTimestamp } from '@/utils/date-formatter';

export interface GstCibilAccountReportItem {
  id: string;
  gstin: string;
  name: string;
  contact_number: string;
  reference_id: string;
  report_status?: string;
  request_stage?: string;
  entity_status?: string;
  bureau_rating?: string;
  last_updated: string;
  account_id?: number | string | null;
  account_name?: string | null;
}

interface AccountGstCibilTabProps {
  accountId?: string | number;
  accountPhone?: string;
  onCountChange?: (count: number) => void;
}

export default function AccountGstCibilTab({
  accountId,
  accountPhone,
  onCountChange,
}: AccountGstCibilTabProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<GstCibilAccountReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (
    text: string,
    label: string,
    key: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!text || text === 'N/A' || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedId((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const fetchReports = async (showSpinner = false) => {
    if (!accountId) return;

    try {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const backendUrl = ENV.VITE_BACKEND_BASE_URL || '';
      const res = await fetch(
        `${backendUrl}/gst-cibil-reports?account_id=${accountId}`,
        {
          credentials: 'include',
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to load reports (Status: ${res.status})`);
      }

      const result = await res.json();
      const reports = result.data || [];
      setData(reports);
      if (onCountChange) {
        onCountChange(reports.length);
      }
    } catch (err: any) {
      console.error('Error fetching account GST/Cibil reports:', err);
      setError(err?.message || 'Failed to load GST & Cibil reports');
      toast.error('Failed to load GST & Cibil reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(true);
  }, [accountId]);

  const getStatusBadgeStyle = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-600 border-slate-200';
    const s = status.toLowerCase();
    if (s.includes('success') || s.includes('active') || s.includes('succeeded')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (s.includes('fail') || s.includes('error') || s.includes('cancelled') || s.includes('inactive')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (s.includes('processing') || s.includes('queue') || s.includes('pending') || s.includes('triggered')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const handleRowClick = (referenceId: string) => {
    if (!referenceId) {
      toast.error('No reference ID found for this report');
      return;
    }
    navigate(`/gst-cibil-report/${referenceId}`);
  };

  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.gstin?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.contact_number?.toLowerCase().includes(q) ||
      item.entity_status?.toLowerCase().includes(q)
    );
  });

  return (
    <Card className='shadow-xs border-border'>
      <CardHeader className='border-b border-border/70 px-5 py-3.5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <FileSpreadsheet className='h-5 w-5 text-emerald-600' />
            <CardTitle className='text-base font-semibold'>
              GST & Cibil Reports
            </CardTitle>
            <Badge variant='secondary' className='text-xs px-2 py-0.5 ml-1'>
              {data.length}
            </Badge>
          </div>

          <div className='flex items-center gap-2.5'>

            <Button
              variant='outline'
              size='sm'
              className='h-8 text-xs gap-1.5'
              onClick={() => fetchReports(false)}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isRefreshing ? 'animate-spin text-emerald-600' : 'text-muted-foreground'
                }`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        {isLoading ? (
          <div className='flex items-center justify-center py-16'>
            <Spinner className='h-7 w-7 text-emerald-600' />
          </div>
        ) : error ? (
          <div className='p-10 text-center text-red-500 flex flex-col items-center gap-2'>
            <AlertCircle className='h-6 w-6' />
            <p className='text-sm'>{error}</p>
            <Button size='sm' variant='outline' onClick={() => fetchReports(true)}>
              Retry
            </Button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className='p-12 text-center text-muted-foreground space-y-1.5'>
            <FileSpreadsheet className='h-8 w-8 mx-auto text-muted-foreground/60 mb-2' />
            <p className='text-sm font-medium'>
              No GST & Cibil reports found for this account
            </p>
            <p className='text-xs text-muted-foreground/80'>
              {accountPhone
                ? `Mapped via matching the last 10 digits of phone number (${accountPhone})`
                : 'Mapped via matching the last 10 digits of the account phone number'}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader className='bg-muted/40'>
                <TableRow>
                  <TableHead className='w-40 px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    GSTIN
                  </TableHead>
                  <TableHead className='px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Name
                  </TableHead>
                  <TableHead className='px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Contact
                  </TableHead>
                  <TableHead className='px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    GST Status
                  </TableHead>
                  <TableHead className='px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Bureau Rating
                  </TableHead>
                  <TableHead className='px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Last Updated
                  </TableHead>
                  <TableHead className='px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className='divide-y divide-border'>
                {filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className='cursor-pointer transition-colors hover:bg-muted/50'
                    onClick={() => handleRowClick(item.reference_id)}
                  >
                    <TableCell className='px-5 py-3.5 font-medium font-mono text-xs'>
                      <div className='flex items-center gap-1.5'>
                        <span>{item.gstin}</span>
                        {item.gstin && item.gstin !== 'N/A' && (
                          <button
                            type='button'
                            className='inline-flex items-center justify-center p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer'
                            onClick={(e) =>
                              handleCopy(
                                item.gstin,
                                'GSTIN',
                                `${item.id}-gstin`,
                                e,
                              )
                            }
                            title='Copy GSTIN'
                          >
                            {copiedId === `${item.id}-gstin` ? (
                              <Check className='h-3.5 w-3.5 text-emerald-600' />
                            ) : (
                              <Copy className='h-3.5 w-3.5' />
                            )}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='px-5 py-3.5 text-xs font-medium text-foreground'>
                      {item.name}
                    </TableCell>
                    <TableCell className='px-5 py-3.5 text-xs text-muted-foreground'>
                      <div className='flex items-center gap-1.5'>
                        <span>{item.contact_number}</span>
                        {item.contact_number && item.contact_number !== 'N/A' && (
                          <button
                            type='button'
                            className='inline-flex items-center justify-center p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer'
                            onClick={(e) =>
                              handleCopy(
                                item.contact_number,
                                'Phone number',
                                `${item.id}-phone`,
                                e,
                              )
                            }
                            title='Copy Phone Number'
                          >
                            {copiedId === `${item.id}-phone` ? (
                              <Check className='h-3.5 w-3.5 text-emerald-600' />
                            ) : (
                              <Copy className='h-3.5 w-3.5' />
                            )}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='px-5 py-3.5'>
                      <Badge
                        className={`${getStatusBadgeStyle(
                          item.entity_status,
                        )} border rounded-full px-2.5 py-0.5 text-[11px] font-medium`}
                      >
                        {item.entity_status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className='px-5 py-3.5 text-xs font-medium text-foreground'>
                      {item.bureau_rating || 'Not Available'}
                    </TableCell>
                    <TableCell className='px-5 py-3.5 text-xs text-muted-foreground'>
                      {formatCreationTimestamp(item.last_updated)}
                    </TableCell>
                    <TableCell className='px-5 py-3.5 text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item.reference_id);
                        }}
                      >
                        <ExternalLink className='h-3.5 w-3.5 mr-1' />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

