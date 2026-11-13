import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Upload,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Activity,
  FileText,
  AlertCircle,
  Clock,
  ExternalLink,
  Building2,
  Copy,
  Check,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import tabularjs from 'tabularjs'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ENV } from '@/conf'
import { formatCreationTimestamp } from '@/utils/date-formatter'

// Types
interface GstCibilListItem {
  id: string
  gstin: string
  contact_number: string
  name: string
  reference_id: string
  report_status?: string
  request_stage?: string
  entity_status?: string
  bureau_rating?: string
  last_updated: string
  account_id?: number | string | null
  account_name?: string | null
}

interface LifecycleEvent {
  stage?: string
  timestamp?: string
  details?: string | null
  has_error?: boolean
}

interface GstTrackerItem {
  id: string
  gstin: string
  reference_id: string
  report_status: string
  request_stage: string
  retry_count: number
  created_at: string
  updated_at: string
  completed_at: string
  error_message?: string | null
  source_url?: {
    json_url?: string
    pdf_url?: string
    bureau_reports?: Array<{
      bureau: string
      json_url: string
      name?: string
    }>
  } | null
  lifecycle_events?: LifecycleEvent[]
}

const fetchGstCibilData = async (): Promise<GstCibilListItem[]> => {
  const backendUrl = ENV.VITE_BACKEND_BASE_URL || ''
  const res = await fetch(`${backendUrl}/gst-cibil-reports`, {
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch reports')
  }
  const result = await res.json()
  return result.data || []
}

const fetchGstTrackerData = async (): Promise<GstTrackerItem[]> => {
  const backendUrl = ENV.VITE_BACKEND_BASE_URL || ''
  const res = await fetch(`${backendUrl}/gst-cibil-reports/tracker`, {
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch reference tracker data')
  }
  const result = await res.json()
  return result.data || []
}

export default function GstCibilPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'reports' | 'tracker'>('reports')

  // Reports state
  const [data, setData] = useState<GstCibilListItem[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(true)
  const [isRefreshingReports, setIsRefreshingReports] = useState(false)
  const [reportsError, setReportsError] = useState<string | null>(null)

  // Tracker state
  const [trackerData, setTrackerData] = useState<GstTrackerItem[]>([])
  const [isLoadingTracker, setIsLoadingTracker] = useState(true)
  const [isRefreshingTracker, setIsRefreshingTracker] = useState(false)
  const [trackerError, setTrackerError] = useState<string | null>(null)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [singleGstinput, setSingleGstInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (
    text: string,
    label: string,
    key: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    if (!text || text === 'N/A' || text === '—') return
    navigator.clipboard.writeText(text)
    setCopiedId(key)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => {
      setCopiedId((prev) => (prev === key ? null : prev))
    }, 1800)
  }

  const BaseURl =
    'https://gst-cibil-report-generator-backend-972437264901.asia-east1.run.app'

  const loadReports = async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoadingReports(true)
      else setIsRefreshingReports(true)
      setReportsError(null)

      const result = await fetchGstCibilData()
      setData(result)
    } catch (err: any) {
      setReportsError(err?.message || 'Failed to load GST/Cibil data')
      console.error('Error loading reports:', err)
      toast.error('Failed to load reports from database')
    } finally {
      setIsLoadingReports(false)
      setIsRefreshingReports(false)
    }
  }

  const loadTracker = async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoadingTracker(true)
      else setIsRefreshingTracker(true)
      setTrackerError(null)

      const result = await fetchGstTrackerData()
      setTrackerData(result)
    } catch (err: any) {
      setTrackerError(err?.message || 'Failed to load tracker data')
      console.error('Error loading tracker:', err)
      toast.error('Failed to load tracker data')
    } finally {
      setIsLoadingTracker(false)
      setIsRefreshingTracker(false)
    }
  }

  useEffect(() => {
    loadReports(true)
    loadTracker(true)
  }, [])

  const handleRefreshCurrentTab = () => {
    if (activeTab === 'reports') {
      loadReports(false)
    } else {
      loadTracker(false)
    }
  }

  const singleGstUpload = async () => {
    if (!singleGstinput || singleGstinput.length !== 15) {
      toast.error('Invalid GST Number')
      return
    }

    const payload = {
      gstin_list: [singleGstinput],
    }

    try {
      const res = await fetch(`${BaseURl}/report/generate-reference-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer bb28adac-2792-4795-986d-4733d3ace634',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data?.data?.failed_gst_list?.length > 0) {
        toast.error(
          `Submission Failed - ${data.data.failed_gst_list[0].response_data?.message || 'Unknown error'}`,
        )
      } else {
        toast.success(
          `Submitted Successfully! - ${data?.data?.passed_gst_list?.[0]?.response_data?.message || 'Processing started'}`,
        )
        setSingleGstInput('')
        // Refresh tracker to show the new submission
        loadTracker(false)
      }
    } catch (err) {
      console.error('Error uploading single GSTIN:', err)
      toast.error('Failed to submit GSTIN')
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const result = await tabularjs(file)
      const firstSheet = result.worksheets?.[0]
      const rows = firstSheet?.data || []

      const gstinList: string[] = []

      rows.forEach((row, index) => {
        if (!Array.isArray(row) || row.length === 0) return

        const firstCell = row[0]
        if (firstCell !== null && firstCell !== undefined) {
          const val = String(firstCell).trim()
          if (!val) return

          const lowerVal = val.toLowerCase()
          if (
            index === 0 &&
            (lowerVal.includes('gst') ||
              lowerVal.includes('number') ||
              lowerVal.includes('id'))
          ) {
            return
          }
          gstinList.push(val)
        }
      })

      if (gstinList.length === 0) {
        toast.error('No values found in the first column.')
        return
      }

      const payload = {
        gstin_list: gstinList,
      }

      const res = await fetch(`${BaseURl}/report/generate-reference-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer bb28adac-2792-4795-986d-4733d3ace634',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to process GST list')

      toast.success(`Successfully uploaded ${gstinList.length} GSTINs!`)
      loadTracker(false)
    } catch (err) {
      console.error('Error processing spreadsheet:', err)
      toast.error(
        'Failed to parse the uploaded file. Please ensure it is a valid CSV or Excel file.',
      )
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRowClick = (referenceId: string) => {
    if (!referenceId) {
      toast.error('No reference ID found for this report')
      return
    }
    navigate(`/gst-cibil-report/${referenceId}`)
  }

  const getStatusBadgeStyle = (status?: string) => {
    if (!status) return 'bg-slate-100 text-slate-600 border-slate-200'

    const s = status.toLowerCase()
    if (s.includes('success') || s.includes('active') || s.includes('succeeded')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    if (s.includes('fail') || s.includes('error') || s.includes('cancelled') || s.includes('inactive')) {
      return 'bg-red-100 text-red-700 border-red-200'
    }
    if (s.includes('processing') || s.includes('queue') || s.includes('pending') || s.includes('triggered')) {
      return 'bg-amber-100 text-amber-700 border-amber-200'
    }
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <div className='mx-auto w-full animate-in fade-in zoom-in duration-300 px-4 py-4 space-y-5'>
      {/* Top Header */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            GST & Cibil Reports
          </h1>
          <p className='text-sm text-slate-500'>
            View generated reports and real-time upload reference tracking
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <input
            ref={inputRef}
            type='file'
            accept='.csv, .xlsx, .xls'
            onChange={handleFile}
            className='hidden'
          />

          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className='flex items-center gap-2'
          >
            {isUploading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <Upload className='h-4 w-4' />
                Upload Spreadsheet
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'reports' | 'tracker')}
        className='w-full'
      >
        <div className='flex items-center justify-between gap-4 border-b pb-3 flex-wrap'>
          <TabsList className='bg-slate-100 p-1 rounded-lg'>
            <TabsTrigger
              value='reports'
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md shadow-none data-[state=active]:shadow-sm'
            >
              <FileSpreadsheet className='h-4 w-4' />
              Generated Reports
              <Badge variant='secondary' className='ml-1 text-xs px-1.5 py-0'>
                {data.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value='tracker'
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md shadow-none data-[state=active]:shadow-sm'
            >
              <Activity className='h-4 w-4' />
              Reference Tracker
              <Badge variant='secondary' className='ml-1 text-xs px-1.5 py-0'>
                {trackerData.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Quick Actions (Search/Upload/Refresh) */}
          <div className='flex items-center gap-3'>
            <div className='relative flex items-center w-60'>
              <Input
                className='w-full pr-16 h-9 text-xs'
                placeholder='Enter GST number...'
                value={singleGstinput}
                onChange={(e) => setSingleGstInput(e.target.value)}
              />
              <Button
                variant='ghost'
                size='sm'
                className='absolute right-1 h-7 px-2 text-xs font-medium'
                onClick={() => singleGstUpload()}
              >
                Submit
              </Button>
            </div>

            <Button
              variant='outline'
              size='sm'
              className='h-9 px-3 gap-1.5'
              onClick={handleRefreshCurrentTab}
              disabled={
                activeTab === 'reports'
                  ? isRefreshingReports || isLoadingReports
                  : isRefreshingTracker || isLoadingTracker
              }
              title={`Refresh ${activeTab === 'reports' ? 'Reports' : 'Tracker'}`}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  (activeTab === 'reports' ? isRefreshingReports : isRefreshingTracker)
                    ? 'animate-spin text-emerald-600'
                    : 'text-slate-600'
                }`}
              />
              <span className='hidden sm:inline text-xs'>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Tab 1: Generated Reports */}
        <TabsContent value='reports' className='mt-4 outline-none'>
          <Card className='shadow-sm'>
            <CardHeader className='border-b px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center justify-between'>
                <span>Generated Reports</span>
              </CardTitle>
            </CardHeader>

            <CardContent className='p-0'>
              {isLoadingReports ? (
                <div className='flex items-center justify-center py-20'>
                  <Spinner className='h-8 w-8' />
                </div>
              ) : reportsError ? (
                <div className='p-12 text-center text-red-500 flex flex-col items-center gap-2'>
                  <AlertCircle className='h-6 w-6' />
                  <p>{reportsError}</p>
                  <Button size='sm' onClick={() => loadReports(true)}>
                    Retry
                  </Button>
                </div>
              ) : data.length === 0 ? (
                <div className='p-12 text-center text-slate-500'>
                  <p>No GST/Cibil reports found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className='border-b border-slate-200'>
                    <TableRow>
                      <TableHead className='w-32 px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        GSTIN
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Name
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Account
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Contact
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        GST Status
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
                        className='cursor-pointer transition-colors hover:bg-slate-50/70'
                        onClick={() => handleRowClick(item.reference_id)}
                      >
                        <TableCell className='px-6 py-4 font-medium font-mono text-sm'>
                          <div className='flex items-center gap-1.5'>
                            <span>{item.gstin}</span>
                            {item.gstin && item.gstin !== 'N/A' && (
                              <button
                                type='button'
                                className='inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer'
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
                        <TableCell className='px-6 py-4 text-sm font-medium text-slate-800'>
                          {item.name}
                        </TableCell>
                        <TableCell className='px-6 py-4 text-sm'>
                          {item.account_name && item.account_name !== 'No Account' && item.account_id ? (
                            <div
                              className='inline-flex items-center gap-1.5 font-medium text-blue-700 hover:text-blue-800 hover:underline cursor-pointer'
                              onClick={(e) => {
                                e.stopPropagation()
                                if (item.account_id) navigate(`/accounts/${item.account_id}`)
                              }}
                              title='Click to view account'
                            >
                              <Building2 className='h-3.5 w-3.5 text-blue-600 shrink-0' />
                              <span className='truncate max-w-[180px]'>{item.account_name}</span>
                            </div>
                          ) : (
                            <Badge variant='outline' className='text-slate-500 font-normal bg-slate-50 text-xs border-slate-200'>
                              No Account
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className='px-6 py-4 text-sm'>
                          <div className='flex items-center gap-1.5'>
                            <span>{item.contact_number}</span>
                            {item.contact_number && item.contact_number !== 'N/A' && (
                              <button
                                type='button'
                                className='inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer'
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
                        <TableCell className='px-6 py-4'>
                          <Badge
                            className={`${getStatusBadgeStyle(
                              item.entity_status,
                            )} border rounded-full px-3 py-0.5 text-xs font-medium`}
                          >
                            {item.entity_status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className='px-6 py-4 text-sm font-medium text-slate-700'>
                          {item.bureau_rating || 'Not Available'}
                        </TableCell>
                        <TableCell className='px-6 py-4 text-sm text-slate-500'>
                          {formatCreationTimestamp(item.last_updated)}
                        </TableCell>
                        <TableCell className='px-6 py-4 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            {item.account_id && item.account_name && item.account_name !== 'No Account' && (
                              <Button
                                variant='outline'
                                size='sm'
                                className='h-8 text-xs border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/accounts/${item.account_id}`)
                                }}
                                title='View Account'
                              >
                                <Building2 className='h-3.5 w-3.5 mr-1' />
                                View Account
                              </Button>
                            )}
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRowClick(item.reference_id)
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: GST Reference Tracker */}
        <TabsContent value='tracker' className='mt-4 outline-none'>
          <Card className='shadow-sm'>
            <CardHeader className='border-b px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center justify-between'>
                <span>GST Reference Tracker</span>
              </CardTitle>
            </CardHeader>

            <CardContent className='p-0'>
              {isLoadingTracker ? (
                <div className='flex items-center justify-center py-20'>
                  <Spinner className='h-8 w-8' />
                </div>
              ) : trackerError ? (
                <div className='p-12 text-center text-red-500 flex flex-col items-center gap-2'>
                  <AlertCircle className='h-6 w-6' />
                  <p>{trackerError}</p>
                  <Button size='sm' onClick={() => loadTracker(true)}>
                    Retry
                  </Button>
                </div>
              ) : trackerData.length === 0 ? (
                <div className='p-12 text-center text-slate-500'>
                  <p>No GST reference tracking records found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className='border-b border-slate-200'>
                    <TableRow>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        GSTIN
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Reference ID
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Report Status
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Created At
                      </TableHead>
                      <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Last Error / Note
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className='divide-y divide-slate-200'>
                    {trackerData.map((item) => (
                      <TableRow
                        key={item.id}
                        className=' transition-colors hover:bg-slate-50/70'
                      >
                        <TableCell className='px-6 py-4 font-mono font-medium text-sm'>
                          {item.gstin}
                        </TableCell>
                        <TableCell className='px-6 py-4 font-mono text-xs text-slate-600'>
                          {item.reference_id}
                        </TableCell>
                        <TableCell className='px-6 py-4'>
                          <Badge
                            className={`${getStatusBadgeStyle(
                              item.report_status,
                            )} border rounded-full px-3 py-0.5 text-xs font-medium`}
                          >
                            {item.report_status || 'PENDING'}
                          </Badge>
                        </TableCell>
                        <TableCell className='px-6 py-4 text-xs text-slate-500'>
                          {item.created_at
                            ? formatCreationTimestamp(item.created_at)
                            : 'N/A'}
                        </TableCell>
                        <TableCell className='px-6 py-4 text-xs max-w-xs'>
                          {item.error_message ? (
                            <span className='text-red-600 line-clamp-2' title={item.error_message}>
                              {item.error_message}
                            </span>
                          ) : (
                            <span className='text-slate-400'>—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

