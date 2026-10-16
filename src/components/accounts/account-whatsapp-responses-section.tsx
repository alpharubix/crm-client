import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAccountTemplateResponses,
  type AccountTemplateSummaryItem,
  type AccountTemplateResponseHistoryItem,
} from '@/api/whatsapp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatExactDate } from '@/utils/date-formatter';

interface AccountWhatsAppResponsesSectionProps {
  accountId: number | string | undefined;
  accountName?: string;
}

export default function AccountWhatsAppResponsesSection({
  accountId,
  accountName,
}: AccountWhatsAppResponsesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'history'>('summary');

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['account-whatsapp-template-responses', accountId],
    queryFn: () => fetchAccountTemplateResponses(accountId!),
    enabled: Boolean(accountId),
    staleTime: 30000,
  });

  const templates = data?.summary?.templates || [];
  const history = data?.history || [];

  const filteredTemplates = templates.filter((t) =>
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.button_text && t.button_text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredHistory = history.filter((h) =>
    h.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.customer_phone.includes(searchTerm) ||
    (h.button_text && h.button_text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalInterested = data?.summary?.total_interested || 0;
  const totalNotInterested = data?.summary?.total_not_interested || 0;
  const totalTemplates = data?.summary?.total_unique_templates_responded || 0;

  return (
    <Card className='border shadow-xs overflow-hidden'>
      <CardHeader className='p-4 pb-3 bg-muted/20 border-b flex flex-col md:flex-row md:items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <div className='p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
            <MessageSquare className='size-5' />
          </div>
          <div>
            <CardTitle className='text-base font-semibold flex items-center gap-2'>
              WhatsApp Template Responses
              <Badge variant='outline' className='text-xs font-normal bg-background'>
                {totalTemplates} Template{totalTemplates === 1 ? '' : 's'}
              </Badge>
            </CardTitle>
            <p className='text-xs text-muted-foreground'>
              Customer feedback and interest status per WhatsApp template for {accountName || 'this Account'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 self-start md:self-auto flex-wrap'>
          {/* Summary / History toggle */}
          <div className='flex items-center p-1 bg-muted/60 rounded-lg text-xs font-medium border'>
            <button
              type='button'
              onClick={() => setViewMode('summary')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-background text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Template Summary ({templates.length})
            </button>
            <button
              type='button'
              onClick={() => setViewMode('history')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-background text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Response History ({history.length})
            </button>
          </div>

          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className='h-8 text-xs flex items-center gap-1.5 cursor-pointer'
          >
            <RefreshCw
              className={`size-3.5 ${isLoading || isRefetching ? 'animate-spin text-emerald-600' : ''}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-4 space-y-4'>
        {/* KPI Counter Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <div className='p-3.5 rounded-lg border bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent flex items-center justify-between'>
            <div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Interested
              </p>
              <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5'>
                {totalInterested}
              </p>
              <p className='text-[11px] text-muted-foreground mt-0.5'>
                Positively responded templates
              </p>
            </div>
            <div className='p-2.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full'>
              <ThumbsUp className='size-5' />
            </div>
          </div>

          <div className='p-3.5 rounded-lg border bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent flex items-center justify-between'>
            <div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Not Interested
              </p>
              <p className='text-2xl font-bold text-rose-700 dark:text-rose-400 mt-0.5'>
                {totalNotInterested}
              </p>
              <p className='text-[11px] text-muted-foreground mt-0.5'>
                Declined or opted out
              </p>
            </div>
            <div className='p-2.5 bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-full'>
              <ThumbsDown className='size-5' />
            </div>
          </div>

          <div className='p-3.5 rounded-lg border bg-muted/30 flex items-center justify-between'>
            <div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Total Responded Templates
              </p>
              <p className='text-2xl font-bold text-foreground mt-0.5'>
                {totalTemplates}
              </p>
              <p className='text-[11px] text-muted-foreground mt-0.5'>
                {history.length} total customer responses logged
              </p>
            </div>
            <div className='p-2.5 bg-muted text-foreground rounded-full'>
              <Sparkles className='size-5 text-amber-500' />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className='flex items-center gap-2 max-w-sm'>
          <div className='relative w-full'>
            <Search className='size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2' />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search by template name or response...'
              className='h-8 pl-8 text-xs'
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className='p-8 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
            <RefreshCw className='size-5 animate-spin text-emerald-600' />
            <span>Loading WhatsApp template responses from PostgreSQL...</span>
          </div>
        ) : error ? (
          <div className='p-6 text-center text-sm text-destructive'>
            Failed to load template responses. Please try refreshing.
          </div>
        ) : viewMode === 'summary' ? (
          filteredTemplates.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground border rounded-lg bg-muted/10'>
              <p>No template responses recorded yet for this Account.</p>
              <p className='text-xs text-muted-foreground mt-1'>
                When customers reply "Interested" or "Not Interested" to WhatsApp templates, they will appear here.
              </p>
            </div>
          ) : (
            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead className='font-semibold'>Template Name</TableHead>
                    <TableHead className='font-semibold'>Customer Feedback</TableHead>
                    <TableHead className='font-semibold'>Button / Text Clicked</TableHead>
                    <TableHead className='font-semibold'>Responded Phone</TableHead>
                    <TableHead className='font-semibold'>Last Responded</TableHead>
                    <TableHead className='font-semibold text-right'>Total Times</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((item, idx) => {
                    const isInterested = item.latest_status === 'interested';
                    return (
                      <TableRow key={idx} className='hover:bg-muted/30'>
                        <TableCell className='font-mono font-medium text-xs text-foreground'>
                          {item.template_name}
                        </TableCell>
                        <TableCell>
                          {isInterested ? (
                            <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 font-medium'>
                              <CheckCircle2 className='size-3.5 text-emerald-600' />
                              <span>Interested</span>
                            </Badge>
                          ) : (
                            <Badge className='bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1.5 font-medium'>
                              <XCircle className='size-3.5 text-rose-600' />
                              <span>Not Interested</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground font-medium'>
                          "{item.button_text || item.latest_status}"
                        </TableCell>
                        <TableCell className='text-xs font-mono font-medium'>
                          {item.customer_phone ? item.customer_phone.slice(-10) : '—'}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {item.responded_at
                            ? formatExactDate(item.responded_at, 'dd MMM yyyy, hh:mm a')
                            : '—'}
                        </TableCell>
                        <TableCell className='text-right text-xs font-semibold'>
                          {item.response_count}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          filteredHistory.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground border rounded-lg bg-muted/10'>
              <p>No response history found matching search.</p>
            </div>
          ) : (
            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead className='font-semibold'>Date & Time</TableHead>
                    <TableHead className='font-semibold'>Template Name</TableHead>
                    <TableHead className='font-semibold'>Status</TableHead>
                    <TableHead className='font-semibold'>Button / Text Clicked</TableHead>
                    <TableHead className='font-semibold'>Customer Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((h) => {
                    const isInterested = h.response_status === 'interested';
                    return (
                      <TableRow key={h.id} className='hover:bg-muted/30'>
                        <TableCell className='text-xs text-muted-foreground whitespace-nowrap'>
                          <div className='flex items-center gap-1.5'>
                            <Clock className='size-3 text-muted-foreground' />
                            <span>
                              {h.responded_at
                                ? formatExactDate(h.responded_at, 'dd MMM yyyy, hh:mm a')
                                : '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='font-mono font-medium text-xs'>
                          {h.template_name}
                        </TableCell>
                        <TableCell>
                          {isInterested ? (
                            <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 font-medium'>
                              <CheckCircle2 className='size-3.5 text-emerald-600' />
                              <span>Interested</span>
                            </Badge>
                          ) : (
                            <Badge className='bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1.5 font-medium'>
                              <XCircle className='size-3.5 text-rose-600' />
                              <span>Not Interested</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground font-medium'>
                          "{h.button_text || h.response_status}"
                        </TableCell>
                        <TableCell className='text-xs font-mono font-medium'>
                          {h.customer_phone ? h.customer_phone.slice(-10) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
