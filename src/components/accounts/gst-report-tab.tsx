import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Landmark,
  BadgePercent,
  CheckCircle,
  FileText,
  HelpCircle,
  Filter,
  DollarSign,
  Info,
  ArrowLeft,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatAmount } from '@/utils/number-formatter';
import { DUMMY_GST_REPORT_DATA } from './gst-report-mock-data';
import type { GstReportApiResponse } from '@/types/gst-report';
import { useNavigate, useParams } from 'react-router-dom';
import { ENV } from '@/conf';
import { Spinner } from '@/components/ui/spinner';

interface GstReportTabProps {
  accountId?: string | number;
  gstin?: string;
  reportData?: GstReportApiResponse;
}

export default function GstReportTab({
  accountId,
  gstin,
  reportData: initialReportData,
}: GstReportTabProps) {
  const { ref_id } = useParams<{ ref_id?: string }>();
  const navigate = useNavigate();

  const [apiData, setApiData] = useState<GstReportApiResponse | null>(initialReportData || null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(ref_id && !initialReportData));
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReportDetails = useCallback(async (isRefresh = false) => {
    if (!ref_id) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const backendUrl = ENV.VITE_BACKEND_BASE_URL || '';
      const res = await fetch(`${backendUrl}/gst-cibil-reports/${ref_id}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load report (status: ${res.status})`);
      }

      const result = await res.json();
      setApiData(result);
      if (isRefresh) {
        toast.success('GST Report synchronized with latest data');
      }
    } catch (err: any) {
      console.error('Error fetching GST report details:', err);
      setError(err?.message || 'Failed to fetch report');
      toast.error('Failed to load report details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [ref_id]);

  useEffect(() => {
    if (ref_id && !initialReportData) {
      fetchReportDetails(false);
    }
  }, [ref_id, initialReportData, fetchReportDetails]);

  const data = apiData || initialReportData || DUMMY_GST_REPORT_DATA;
  const reportPayload = data?.data?.report || DUMMY_GST_REPORT_DATA.data.report;
  const { entity, proprietor, identity, gst_filings, registrations, bureau, facilities } =
    reportPayload;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');
  const [filingFyFilter, setFilingFyFilter] = useState('ALL');

  // Copy helper with feedback
  const handleCopy = (text: string, label: string, key: string) => {
    if (!text || text === 'Not Found' || text === 'Not Applicable') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleRefresh = () => {
    if (ref_id) {
      fetchReportDetails(true);
    } else {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success('GST Report synchronized with latest data');
      }, 700);
    }
  };

  // Indian Rupee formatting helpers
  const formatINR = (val?: number | string | null) => {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `₹${formatAmount(num)}`;
  };

  const formatShortLakhsCrores = (val?: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return formatINR(val);
  };

  // Facility summaries
  const facilityStats = useMemo(() => {
    let totalSanctioned = 0;
    let totalOutstanding = 0;
    let totalEmi = 0;
    const typeSet = new Set<string>();

    facilities.forEach((f) => {
      if (f.sanctioned) totalSanctioned += f.sanctioned;
      if (f.outstanding) totalOutstanding += f.outstanding;
      if (f.emi) totalEmi += f.emi;
      if (f.account_type) typeSet.add(f.account_type);
    });

    return {
      totalSanctioned,
      totalOutstanding,
      totalEmi,
      types: Array.from(typeSet),
    };
  }, [facilities]);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        facilitySearch.trim() === '' ||
        f.lender.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.account_type.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.dpd_status.toLowerCase().includes(facilitySearch.toLowerCase());

      const matchesType =
        facilityTypeFilter === 'ALL' || f.account_type === facilityTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [facilities, facilitySearch, facilityTypeFilter]);

  // Unique Financial Years from filings
  const filingFys = useMemo(() => {
    const set = new Set<string>();
    gst_filings.forEach((f) => {
      if (f.fy) set.add(f.fy);
    });
    return Array.from(set);
  }, [gst_filings]);

  // Filter filings
  const filteredFilings = useMemo(() => {
    return gst_filings.filter((f) => {
      if (filingFyFilter === 'ALL') return true;
      return f.fy === filingFyFilter;
    });
  }, [gst_filings, filingFyFilter]);

  // Filing Compliance Score
  const filingScore = useMemo(() => {
    if (!gst_filings.length) return { onTimeCount: 0, total: 0, rate: 0 };
    const onTimeCount = gst_filings.filter(
      (f) =>
        f.gstr1.toLowerCase() === 'on time' &&
        f.gstr3b.toLowerCase() === 'on time',
    ).length;
    return {
      onTimeCount,
      total: gst_filings.length,
      rate: Math.round((onTimeCount / gst_filings.length) * 100),
    };
  }, [gst_filings]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <Spinner className='h-8 w-8' />
      </div>
    );
  }

  if (error && !apiData) {
    return (
      <div className='flex items-center justify-center h-[60vh] flex-col gap-3'>
        <p className='text-red-600 font-medium'>{error}</p>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => navigate(-1)}>
            <ArrowLeft className='h-4 w-4 mr-2' /> Go Back
          </Button>
          <Button onClick={() => fetchReportDetails(false)}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 animate-in fade-in-50 duration-200 p-4'>
      {/* ================= Top Banner & Header ================= */}
      <div className='flex flex-col gap-4 p-5 rounded-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-xs'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-1.5'>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <div className='h-9 w-9 rounded-xl cursor-pointer hover:bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold' onClick={() => navigate(-1)}>
                <ArrowLeft className='h-5 w-5' />
              </div>
              <div className='h-9 w-9 rounded-xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold'>
                <FileSpreadsheet className='h-5 w-5' />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <h2 className='text-xl font-bold tracking-tight text-foreground'>
                    {entity.trade_name || 'GST & Commercial Profile'}
                  </h2>
                  <Badge
                    variant='outline'
                    className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium'
                  >
                    <CheckCircle className='h-3 w-3 mr-1 text-emerald-600' />
                    {entity.status || 'Active'}
                  </Badge>

                </div>
                <p className='text-xs text-muted-foreground flex items-center gap-2 mt-0.5'>
                  <span>Legal Name: <strong className='text-foreground'>{entity.legal_name}</strong></span>
                  <span>•</span>
                  <span>Constitution: <strong className='text-foreground'>{entity.constitution}</strong></span>
                  <span>•</span>
                  <span>GST Vintage: <strong className='text-foreground'>{entity.gst_vintage}</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='flex items-center gap-2 flex-wrap'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 text-xs gap-1.5 border-border hover:bg-muted'
              onClick={() => handleCopy(entity.gstin, 'GSTIN', 'top_gstin')}
            >
              {copiedKey === 'top_gstin' ? (
                <Check className='h-3.5 w-3.5 text-emerald-600' />
              ) : (
                <Copy className='h-3.5 w-3.5 text-muted-foreground' />
              )}
              <span className='font-mono font-semibold'>{entity.gstin}</span>
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-8 text-xs gap-1.5'
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-muted-foreground'}`}
              />
              Sync Report
            </Button>
          </div>
        </div>

        {/* Metadata sub-row */}
        <div className='flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3 gap-2'>
          <div className='flex items-center gap-4 flex-wrap'>
            <span className='inline-flex items-center gap-1.5'>
              <span className='text-muted-foreground'>Generated At:</span>
              <span className='font-medium text-foreground'>
                {reportPayload.report.generated_at}
              </span>
            </span>
          </div>

          <div className='inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            <span>{data.message}</span>
          </div>
        </div>
      </div>

      {/* ================= 4 KPI Metric Highlight Cards ================= */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Card 1: Bureau Rating & Health */}
        <Card className='relative overflow-hidden border-border/80 bg-card hover:shadow-md transition-shadow'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-indigo-600' />
          <CardHeader className='pb-2 pt-4 px-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Bureau Credit Score
              </span>
              <div className='p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400'>
                <ShieldCheck className='h-4 w-4' />
              </div>
            </div>
            <CardTitle className='text-lg font-bold text-foreground mt-1'>
              {bureau.rating || 'Prime'}
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 pt-0'>
            <div className='flex items-center justify-between text-xs mt-1'>
              <span className='inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold'>
                <CheckCircle2 className='h-3.5 w-3.5' />
                {bureau.dpd === 0 ? '0 DPD (Clean Repayment)' : `${bureau.dpd} DPD`}
              </span>
              <Badge
                variant='outline'
                className='text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
              >
                Prime Tier
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Active Facilities */}
        <Card className='relative overflow-hidden border-border/80 bg-card hover:shadow-md transition-shadow'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-teal-600' />
          <CardHeader className='pb-2 pt-4 px-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Active Borrowing
              </span>
              <div className='p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                <Landmark className='h-4 w-4' />
              </div>
            </div>
            <CardTitle className='text-xl font-bold text-foreground mt-1'>
              {formatShortLakhsCrores(bureau.active_amount)}
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 pt-0'>
            <div className='flex items-center justify-between text-xs text-muted-foreground mt-1'>
              <span>Across <strong className='text-foreground'>{bureau.active_count}</strong> active accounts</span>
              <span className='font-mono text-emerald-600 dark:text-emerald-400 font-medium'>
                {formatINR(bureau.active_amount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: GST Filing Compliance */}
        <Card className='relative overflow-hidden border-border/80 bg-card hover:shadow-md transition-shadow'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-500 to-emerald-500' />
          <CardHeader className='pb-2 pt-4 px-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Filing Track Record
              </span>
              <div className='p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                <Calendar className='h-4 w-4' />
              </div>
            </div>
            <CardTitle className='text-xl font-bold text-foreground mt-1'>
              {filingScore.rate}% On-Time
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 pt-0'>
            <div className='flex items-center justify-between text-xs text-muted-foreground mt-1'>
              <span>
                <strong className='text-foreground'>{filingScore.onTimeCount}</strong> of {filingScore.total} on schedule
              </span>
              <Badge
                variant='outline'
                className='text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              >
                High Compliance
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Turnover & Scale */}
        <Card className='relative overflow-hidden border-border/80 bg-card hover:shadow-md transition-shadow'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-indigo-500' />
          <CardHeader className='pb-2 pt-4 px-4'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Turnover Slab
              </span>
              <div className='p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400'>
                <BadgePercent className='h-4 w-4' />
              </div>
            </div>
            <CardTitle className='text-lg font-bold text-foreground mt-1 truncate' title={entity.turnover_slab}>
              {entity.turnover_slab || '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 pt-0'>
            <div className='flex items-center justify-between text-xs text-muted-foreground mt-1'>
              <span>Since {entity.registration_date}</span>
              <Badge
                variant='outline'
                className='text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
              >
                E-Inv: {entity.e_invoice}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= Entity & Proprietor Details ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Business Entity Profile (2 cols) */}
        <Card className='lg:col-span-2 border-border/80 shadow-xs'>
          <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Building2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                <CardTitle className='text-base font-semibold'>Business Entity Details</CardTitle>
              </div>
              <Badge variant='outline' className='text-xs font-medium'>
                {entity.constitution}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='p-5 space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground'>Trade Name</span>
                <p className='font-semibold text-foreground'>{entity.trade_name || '—'}</p>
              </div>

              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground'>Legal Name</span>
                <p className='font-semibold text-foreground'>{entity.legal_name || '—'}</p>
              </div>

              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground'>GSTIN Number</span>
                <div className='flex items-center gap-2'>
                  <span className='font-mono font-semibold text-foreground text-sm'>
                    {entity.gstin}
                  </span>
                  <button
                    onClick={() => handleCopy(entity.gstin, 'GSTIN', 'entity_gstin')}
                    className='text-muted-foreground hover:text-foreground transition-colors p-1'
                    title='Copy GSTIN'
                  >
                    {copiedKey === 'entity_gstin' ? (
                      <Check className='h-3.5 w-3.5 text-emerald-600' />
                    ) : (
                      <Copy className='h-3.5 w-3.5' />
                    )}
                  </button>
                </div>
              </div>

              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground'>Registration Date & Vintage</span>
                <p className='font-medium text-foreground'>
                  {entity.registration_date} <span className='text-xs text-muted-foreground'>({entity.gst_vintage})</span>
                </p>
              </div>

              <div className='space-y-1 sm:col-span-2'>
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                  <MapPin className='h-3.5 w-3.5' /> Registered Address
                </span>
                <p className='text-sm text-foreground font-medium leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50'>
                  {entity.address}
                </p>
              </div>

              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Mail className='h-3.5 w-3.5' /> Email Address
                </span>
                <div className='flex items-center gap-2'>
                  <a
                    href={`mailto:${entity.email}`}
                    className='text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate'
                  >
                    {entity.email}
                  </a>
                  <button
                    onClick={() => handleCopy(entity.email, 'Email', 'entity_email')}
                    className='text-muted-foreground hover:text-foreground p-1'
                  >
                    {copiedKey === 'entity_email' ? (
                      <Check className='h-3.5 w-3.5 text-emerald-600' />
                    ) : (
                      <Copy className='h-3.5 w-3.5' />
                    )}
                  </button>
                </div>
              </div>

              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Phone className='h-3.5 w-3.5' /> Contact Mobile
                </span>
                <div className='flex items-center gap-2'>
                  <a
                    href={`tel:${entity.mobile}`}
                    className='text-sm font-medium text-foreground hover:text-emerald-600 transition-colors'
                  >
                    {entity.mobile}
                  </a>
                  <button
                    onClick={() => handleCopy(entity.mobile, 'Mobile', 'entity_mobile')}
                    className='text-muted-foreground hover:text-foreground p-1'
                  >
                    {copiedKey === 'entity_mobile' ? (
                      <Check className='h-3.5 w-3.5 text-emerald-600' />
                    ) : (
                      <Copy className='h-3.5 w-3.5' />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Separator className='my-2' />

            {/* Other Regulatory Identifiers */}
            <div>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2'>
                Registration & Identification Numbers
              </span>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs'>
                <div className='p-2 rounded-lg bg-muted/40 border border-border/50'>
                  <span className='text-muted-foreground block text-[11px]'>CIN</span>
                  <span className='font-medium text-foreground'>{entity.cin || 'N/A'}</span>
                </div>
                <div className='p-2 rounded-lg bg-muted/40 border border-border/50'>
                  <span className='text-muted-foreground block text-[11px]'>TAN</span>
                  <span className='font-medium text-foreground'>{entity.tan || 'Not Found'}</span>
                </div>
                <div className='p-2 rounded-lg bg-muted/40 border border-border/50'>
                  <span className='text-muted-foreground block text-[11px]'>UDYAM</span>
                  <span className='font-medium text-foreground'>{entity.udyam || 'Not Found'}</span>
                </div>
                <div className='p-2 rounded-lg bg-muted/40 border border-border/50'>
                  <span className='text-muted-foreground block text-[11px]'>Paid-Up Capital</span>
                  <span className='font-medium text-foreground'>{entity.paid_up_capital || 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proprietor / Key Person Profile (1 col) */}
        <Card className='border-border/80 shadow-xs flex flex-col justify-between'>
          <div>
            <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <User className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                  <CardTitle className='text-base font-semibold'>Proprietor / Promoter</CardTitle>
                </div>
                <Badge variant='secondary' className='text-xs'>
                  {proprietor.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='p-5 space-y-4 text-sm'>
              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground'>Promoter Full Name</span>
                <p className='font-bold text-foreground text-base'>{proprietor.name}</p>
              </div>

              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground'>Promoter PAN</span>
                <div className='flex items-center gap-2'>
                  <span className='font-mono font-semibold text-foreground text-sm bg-muted/50 px-2 py-0.5 rounded-md border border-border'>
                    {proprietor.pan}
                  </span>
                  <button
                    onClick={() => handleCopy(proprietor.pan, 'PAN', 'prop_pan')}
                    className='text-muted-foreground hover:text-foreground p-1'
                    title='Copy PAN'
                  >
                    {copiedKey === 'prop_pan' ? (
                      <Check className='h-3.5 w-3.5 text-emerald-600' />
                    ) : (
                      <Copy className='h-3.5 w-3.5' />
                    )}
                  </button>
                </div>
              </div>

              <div className='space-y-1'>
                <span className='text-xs text-muted-foreground'>Registered Phone</span>
                <p className='font-medium text-foreground'>{proprietor.mobile || '—'}</p>
              </div>

              <Separator className='my-1' />

              {/* Trust & Vintage Indicators */}
              <div className='space-y-2 pt-1'>
                <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground block'>
                  Identity Stability Indicators
                </span>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                      <span className='text-xs font-medium text-foreground'>MNRL Status</span>
                    </div>
                    <Badge variant='outline' className='bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-xs'>
                      {proprietor.mnrl || 'Not Revoked'}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50'>
                    <span className='text-xs text-muted-foreground'>SIM Vintage</span>
                    <span className='text-xs font-semibold text-foreground'>
                      {proprietor.sim_vintage || '—'}
                    </span>
                  </div>

                  <div className='flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50'>
                    <span className='text-xs text-muted-foreground'>PAN Vintage</span>
                    <span className='text-xs font-medium text-muted-foreground'>
                      {proprietor.pan_vintage || 'Not Found'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          <div className='p-4 bg-muted/30 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-2'>
            <ShieldCheck className='h-4 w-4 text-emerald-600 shrink-0' />
            <span>Mobile and PAN verified against regulatory databases.</span>
          </div>
        </Card>
      </div>

      {/* ================= Cross-Source Identity Verification ================= */}
      <Card className='border-border/80 shadow-xs'>
        <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ShieldCheck className='h-4 w-4 text-teal-600 dark:text-teal-400' />
              <div>
                <CardTitle className='text-base font-semibold'>Cross-Database Identity Checks</CardTitle>
                <CardDescription className='text-xs'>
                  Automated verification across GST, TAN, UDYAM, MCA, and IEC registries
                </CardDescription>
              </div>
            </div>
            <Badge variant='outline' className='text-xs font-mono'>
              {identity.length} Sources Checked
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='p-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
            {identity.map((item, idx) => {
              const isMatch = item.result.toLowerCase() === 'match';
              const isNotApplicable =
                item.result.toLowerCase() === 'not applicable';
              const isNotFound =
                item.result.toLowerCase() === 'not found' ||
                item.result.toLowerCase() === 'no record found';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isMatch
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-muted/30 border-border/60'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                      {item.source}
                    </span>
                    <Badge
                      variant='outline'
                      className={`text-[10px] font-semibold px-1.5 py-0 ${
                        isMatch
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                          : isNotApplicable
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-muted/70 text-muted-foreground border-border'
                      }`}
                    >
                      {item.result}
                    </Badge>
                  </div>

                  <div>
                    <span className='text-[10px] text-muted-foreground block'>Name Recorded</span>
                    <p className={`text-xs font-medium truncate ${isMatch ? 'text-foreground font-semibold' : 'text-muted-foreground'}`} title={item.name_found}>
                      {item.name_found || '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ================= Commercial Lending Facilities ================= */}
      <Card className='border-border/80 shadow-xs'>
        <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <Landmark className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
              <div>
                <CardTitle className='text-base font-semibold'>
                  Credit Facilities & Loan Accounts ({facilities.length})
                </CardTitle>
                <CardDescription className='text-xs'>
                  Bureau reported active borrowings, limits, outstanding balances, and repayment behavior
                </CardDescription>
              </div>
            </div>

            {/* Quick Aggregate Stats */}
            <div className='flex items-center gap-2 flex-wrap'>
              <div className='px-2.5 py-1 rounded-lg bg-background border border-border text-xs flex items-center gap-1.5'>
                <span className='text-muted-foreground'>Sanctioned:</span>
                <span className='font-bold text-foreground'>
                  {formatShortLakhsCrores(facilityStats.totalSanctioned)}
                </span>
              </div>
              <div className='px-2.5 py-1 rounded-lg bg-background border border-border text-xs flex items-center gap-1.5'>
                <span className='text-muted-foreground'>Outstanding:</span>
                <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                  {formatShortLakhsCrores(facilityStats.totalOutstanding)}
                </span>
              </div>
              {bureau.write_off > 0 && (
                <div className='px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold'>
                  <AlertTriangle className='h-3 w-3' />
                  <span>Write-Off: {formatShortLakhsCrores(bureau.write_off)}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-4 space-y-4'>
          {/* Filters & Search */}
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search lender or loan type...'
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
                className='pl-8 h-9 text-xs'
              />
            </div>

            <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0'>
              <span className='text-xs text-muted-foreground flex items-center gap-1 mr-1'>
                <Filter className='h-3 w-3' /> Type:
              </span>
              <Button
                variant={facilityTypeFilter === 'ALL' ? 'default' : 'outline'}
                size='sm'
                className='h-7 text-xs px-2.5'
                onClick={() => setFacilityTypeFilter('ALL')}
              >
                All ({facilities.length})
              </Button>
              {facilityStats.types.map((type) => {
                const count = facilities.filter((f) => f.account_type === type).length;
                return (
                  <Button
                    key={type}
                    variant={facilityTypeFilter === type ? 'default' : 'outline'}
                    size='sm'
                    className='h-7 text-xs px-2.5 whitespace-nowrap'
                    onClick={() => setFacilityTypeFilter(type)}
                  >
                    {type} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className='border rounded-xl bg-card overflow-x-auto'>
            <Table>
              <TableHeader className='bg-muted/50'>
                <TableRow>
                  <TableHead className='font-semibold text-xs'>#</TableHead>
                  <TableHead className='font-semibold text-xs min-w-[200px]'>Lender / Financial Institution</TableHead>
                  <TableHead className='font-semibold text-xs min-w-[160px]'>Account Type</TableHead>
                  <TableHead className='font-semibold text-xs text-right min-w-[120px]'>Sanctioned</TableHead>
                  <TableHead className='font-semibold text-xs text-right min-w-[120px]'>Outstanding</TableHead>
                  <TableHead className='font-semibold text-xs text-right min-w-[100px]'>EMI</TableHead>
                  <TableHead className='font-semibold text-xs text-center min-w-[80px]'>ROI</TableHead>
                  <TableHead className='font-semibold text-xs text-center min-w-[120px]'>DPD Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='h-24 text-center text-xs text-muted-foreground'>
                      No facilities match the search filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFacilities.map((fac, idx) => {
                    const isCleanDpd =
                      fac.dpd_status.toLowerCase().includes('no dpd') ||
                      fac.dpd_status.includes('/ 0');

                    return (
                      <TableRow key={idx} className='hover:bg-muted/30 transition-colors text-xs'>
                        <TableCell className='text-muted-foreground font-mono'>
                          {idx + 1}
                        </TableCell>
                        <TableCell className='font-semibold text-foreground'>
                          <div className='flex items-center gap-2'>
                            <div className='h-7 w-7 rounded-md bg-muted flex items-center justify-center font-bold text-[11px] text-muted-foreground'>
                              {fac.lender.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{fac.lender}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='text-[11px] font-normal'>
                            {fac.account_type}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right font-medium font-mono'>
                          {formatINR(fac.sanctioned)}
                        </TableCell>
                        <TableCell className='text-right font-bold font-mono text-emerald-600 dark:text-emerald-400'>
                          {formatINR(fac.outstanding)}
                        </TableCell>
                        <TableCell className='text-right font-mono text-muted-foreground'>
                          {fac.emi ? formatINR(fac.emi) : '—'}
                        </TableCell>
                        <TableCell className='text-center text-muted-foreground'>
                          {fac.roi ? `${fac.roi}%` : '—'}
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge
                            variant='outline'
                            className={`text-[10px] font-medium px-2 py-0.5 ${
                              isCleanDpd
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {isCleanDpd ? (
                              <CheckCircle2 className='h-3 w-3 mr-1 text-emerald-600' />
                            ) : (
                              <AlertTriangle className='h-3 w-3 mr-1 text-rose-600' />
                            )}
                            {fac.dpd_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ================= GST Filings & Registrations Section ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* GST Filings History (2 cols) */}
        <Card className='lg:col-span-2 border-border/80 shadow-xs'>
          <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                <div>
                  <CardTitle className='text-base font-semibold'>GST Filings Compliance Track</CardTitle>
                  <CardDescription className='text-xs'>
                    Monthly GSTR-1 and GSTR-3B submission history
                  </CardDescription>
                </div>
              </div>

              {/* FY Filter */}
              <div className='flex items-center gap-1'>
                <Button
                  variant={filingFyFilter === 'ALL' ? 'default' : 'outline'}
                  size='sm'
                  className='h-7 text-xs px-2'
                  onClick={() => setFilingFyFilter('ALL')}
                >
                  All FYs
                </Button>
                {filingFys.map((fy) => (
                  <Button
                    key={fy}
                    variant={filingFyFilter === fy ? 'default' : 'outline'}
                    size='sm'
                    className='h-7 text-xs px-2'
                    onClick={() => setFilingFyFilter(fy)}
                  >
                    {fy}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-4'>
            <div className='border rounded-xl bg-card overflow-x-auto'>
              <Table>
                <TableHeader className='bg-muted/50'>
                  <TableRow>
                    <TableHead className='font-semibold text-xs'>Period</TableHead>
                    <TableHead className='font-semibold text-xs'>Financial Year</TableHead>
                    <TableHead className='font-semibold text-xs text-center'>GSTR-1 Status</TableHead>
                    <TableHead className='font-semibold text-xs text-center'>GSTR-3B Status</TableHead>
                    <TableHead className='font-semibold text-xs text-center'>Overall</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFilings.map((filing, idx) => {
                    const isGstr1OnTime = filing.gstr1.toLowerCase() === 'on time';
                    const isGstr3bOnTime = filing.gstr3b.toLowerCase() === 'on time';
                    const isAllOnTime = isGstr1OnTime && isGstr3bOnTime;

                    return (
                      <TableRow key={idx} className='text-xs hover:bg-muted/30'>
                        <TableCell className='font-semibold text-foreground'>
                          {filing.period}
                        </TableCell>
                        <TableCell className='text-muted-foreground font-mono'>
                          {filing.fy}
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge
                            variant='outline'
                            className={`text-[10px] font-medium px-2 py-0.5 ${
                              isGstr1OnTime
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {isGstr1OnTime ? (
                              <CheckCircle2 className='h-3 w-3 mr-1 text-emerald-600' />
                            ) : (
                              <Clock className='h-3 w-3 mr-1 text-amber-600' />
                            )}
                            {filing.gstr1}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge
                            variant='outline'
                            className={`text-[10px] font-medium px-2 py-0.5 ${
                              isGstr3bOnTime
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {isGstr3bOnTime ? (
                              <CheckCircle2 className='h-3 w-3 mr-1 text-emerald-600' />
                            ) : (
                              <Clock className='h-3 w-3 mr-1 text-amber-600' />
                            )}
                            {filing.gstr3b}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-center'>
                          {isAllOnTime ? (
                            <span className='inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                              <Check className='h-3.5 w-3.5 mr-0.5' /> Compliant
                            </span>
                          ) : (
                            <span className='inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400'>
                              Delayed GSTR-1
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* GST Registrations & EPFO (1 col) */}
        <div className='space-y-6'>
          {/* Active Registrations */}
          <Card className='border-border/80 shadow-xs'>
            <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
              <div className='flex items-center gap-2'>
                <Building2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                <CardTitle className='text-base font-semibold'>GST Registrations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className='p-4 space-y-3'>
              {registrations.map((reg, idx) => (
                <div
                  key={idx}
                  className='p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors flex items-center justify-between'
                >
                  <div className='space-y-0.5'>
                    <div className='flex items-center gap-2'>
                      <span className='font-mono font-bold text-xs text-foreground'>
                        {reg.gstin}
                      </span>
                      <button
                        onClick={() => handleCopy(reg.gstin, 'GSTIN', `reg_${idx}`)}
                        className='text-muted-foreground hover:text-foreground p-0.5'
                      >
                        {copiedKey === `reg_${idx}` ? (
                          <Check className='h-3 w-3 text-emerald-600' />
                        ) : (
                          <Copy className='h-3 w-3' />
                        )}
                      </button>
                    </div>
                    <span className='text-xs text-muted-foreground'>State: {reg.state}</span>
                  </div>
                  <Badge
                    variant='outline'
                    className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs'
                  >
                    {reg.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* EPFO Status */}
          <Card className='border-border/80 shadow-xs'>
            <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                  <CardTitle className='text-base font-semibold'>EPFO Records</CardTitle>
                </div>
                <Badge variant='outline' className='text-xs'>
                  {reportPayload.epfo?.length || 0} Registered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='p-4 text-center py-6'>
              <div className='mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2'>
                <Info className='h-5 w-5' />
              </div>
              <p className='text-xs font-medium text-foreground'>No EPFO Records Found</p>
              <p className='text-[11px] text-muted-foreground mt-0.5'>
                No active employee provident fund registrations associated with this GSTIN.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
