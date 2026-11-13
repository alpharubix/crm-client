import { useState, useEffect, useRef, useMemo } from 'react'
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
  Filter,
  X,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Pagination from '@/components/shared/pagination'
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

  // Helper to extract numeric bureau rating score (e.g. "Experian: 734" -> 734)
  const parseBureauScore = (rating?: string | null): number | null => {
    if (!rating) return null
    const match = rating.match(/\b(\d{3})\b/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num >= 300 && num <= 900) return num
    }
    return null
  }

  // Filtering state - Generated Reports
  const [showReportsFilters, setShowReportsFilters] = useState(false)
  const [reportsFilter, setReportsFilter] = useState({
    gstin: '',
    name: '',
    account: '',
    contact: '',
    gstStatus: 'ALL',
    bureauRating: 'ALL',
    accountMapping: 'ALL', // 'ALL' | 'MAPPED_ONLY' | 'UNMAPPED_ONLY'
    duplicateFilter: 'ALL', // 'ALL' | 'DUPLICATES_ONLY' | 'UNIQUE_ONLY'
    minBureauScore: 300,
    includeNoScore: true,
    fromDate: '',
    toDate: '',
  })

  // Filtering state - GST Reference Tracker
  const [showTrackerFilters, setShowTrackerFilters] = useState(false)
  const [trackerFilter, setTrackerFilter] = useState({
    gstin: '',
    referenceId: '',
    reportStatus: 'ALL',
    duplicateFilter: 'ALL', // 'ALL' | 'DUPLICATES_ONLY' | 'UNIQUE_ONLY'
    fromDate: '',
    toDate: '',
  })

  const clearReportsFilters = () => {
    setReportsFilter({
      gstin: '',
      name: '',
      account: '',
      contact: '',
      gstStatus: 'ALL',
      bureauRating: 'ALL',
      accountMapping: 'ALL',
      duplicateFilter: 'ALL',
      minBureauScore: 300,
      includeNoScore: true,
      fromDate: '',
      toDate: '',
    })
  }

  const clearTrackerFilters = () => {
    setTrackerFilter({
      gstin: '',
      referenceId: '',
      reportStatus: 'ALL',
      duplicateFilter: 'ALL',
      fromDate: '',
      toDate: '',
    })
  }

  // Active filter counters
  const activeReportsFilterCount = useMemo(() => {
    let count = 0
    if (reportsFilter.gstin.trim()) count++
    if (reportsFilter.name.trim()) count++
    if (reportsFilter.account.trim()) count++
    if (reportsFilter.contact.trim()) count++
    if (reportsFilter.gstStatus !== 'ALL') count++
    if (reportsFilter.bureauRating !== 'ALL') count++
    if (reportsFilter.accountMapping !== 'ALL') count++
    if (reportsFilter.duplicateFilter !== 'ALL') count++
    if (reportsFilter.minBureauScore > 300 || !reportsFilter.includeNoScore) count++
    if (reportsFilter.fromDate) count++
    if (reportsFilter.toDate) count++
    return count
  }, [reportsFilter])

  const activeTrackerFilterCount = useMemo(() => {
    let count = 0
    if (trackerFilter.gstin.trim()) count++
    if (trackerFilter.referenceId.trim()) count++
    if (trackerFilter.reportStatus !== 'ALL') count++
    if (trackerFilter.duplicateFilter !== 'ALL') count++
    if (trackerFilter.fromDate) count++
    if (trackerFilter.toDate) count++
    return count
  }, [trackerFilter])

  const hasActiveFilters =
    (activeTab === 'reports' && activeReportsFilterCount > 0) ||
    (activeTab === 'tracker' && activeTrackerFilterCount > 0)

  const clearAllActiveFilters = () => {
    if (activeTab === 'reports') {
      clearReportsFilters()
    } else {
      clearTrackerFilters()
    }
  }

  // Frequency maps for duplicates detection (by normalized GSTIN)
  const reportsGstinCounts = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach((item) => {
      const g = (item.gstin || '').trim().toUpperCase()
      if (g && g !== 'N/A') {
        map.set(g, (map.get(g) || 0) + 1)
      }
    })
    return map
  }, [data])

  const trackerGstinCounts = useMemo(() => {
    const map = new Map<string, number>()
    trackerData.forEach((item) => {
      const g = (item.gstin || '').trim().toUpperCase()
      if (g && g !== 'N/A') {
        map.set(g, (map.get(g) || 0) + 1)
      }
    })
    return map
  }, [trackerData])

  // Summary statistics for accounts mapping and reports
  const reportsStats = useMemo(() => {
    const totalReports = data.length
    const mappedToAccount = data.filter(
      (item) => item.account_id && item.account_name && item.account_name !== 'No Account',
    ).length
    const unmapped = totalReports - mappedToAccount
    const withBureauScore = data.filter((item) => parseBureauScore(item.bureau_rating) !== null).length

    // Duplicate statistics
    const duplicateReportsCount = data.filter((item) => {
      const g = (item.gstin || '').trim().toUpperCase()
      return g && (reportsGstinCounts.get(g) || 0) > 1
    }).length

    const uniqueReportsCount = totalReports - duplicateReportsCount

    const duplicateTrackerCount = trackerData.filter((item) => {
      const g = (item.gstin || '').trim().toUpperCase()
      return g && (trackerGstinCounts.get(g) || 0) > 1
    }).length

    const uniqueTrackerCount = trackerData.length - duplicateTrackerCount

    return {
      totalReports,
      mappedToAccount,
      unmapped,
      withBureauScore,
      duplicateReportsCount,
      uniqueReportsCount,
      duplicateTrackerCount,
      uniqueTrackerCount,
    }
  }, [data, trackerData, reportsGstinCounts, trackerGstinCounts])

  // Distinct options extracted dynamically from data
  const reportsStatusOptions = useMemo(() => {
    const set = new Set<string>()
    data.forEach((item) => {
      if (item.entity_status && item.entity_status.trim()) {
        set.add(item.entity_status.trim())
      }
    })
    return Array.from(set).sort()
  }, [data])

  const reportsRatingOptions = useMemo(() => {
    const set = new Set<string>()
    data.forEach((item) => {
      if (item.bureau_rating && item.bureau_rating.trim()) {
        set.add(item.bureau_rating.trim())
      }
    })
    return Array.from(set).sort()
  }, [data])

  const trackerStatusOptions = useMemo(() => {
    const set = new Set<string>()
    trackerData.forEach((item) => {
      if (item.report_status && item.report_status.trim()) {
        set.add(item.report_status.trim())
      }
    })
    return Array.from(set).sort()
  }, [trackerData])

  // Filtered reports
  const filteredReports = useMemo(() => {
    return data.filter((item) => {
      // GSTIN
      if (
        reportsFilter.gstin.trim() &&
        !item.gstin?.toLowerCase().includes(reportsFilter.gstin.trim().toLowerCase())
      ) {
        return false
      }

      // Name
      if (
        reportsFilter.name.trim() &&
        !item.name?.toLowerCase().includes(reportsFilter.name.trim().toLowerCase())
      ) {
        return false
      }

      // Account
      if (reportsFilter.account.trim()) {
        const query = reportsFilter.account.trim().toLowerCase()
        const acctName = item.account_name || 'No Account'
        if (!acctName.toLowerCase().includes(query)) {
          return false
        }
      }

      // Contact
      if (reportsFilter.contact.trim()) {
        const contactQuery = reportsFilter.contact.replace(/\D/g, '') || reportsFilter.contact.trim()
        const itemContact = (item.contact_number || '').replace(/\D/g, '') || (item.contact_number || '')
        if (!itemContact.includes(contactQuery)) {
          return false
        }
      }

      // GST Status
      if (reportsFilter.gstStatus !== 'ALL') {
        if ((item.entity_status || '').toLowerCase() !== reportsFilter.gstStatus.toLowerCase()) {
          return false
        }
      }

      // Bureau Rating (Dropdown exact option)
      if (reportsFilter.bureauRating !== 'ALL') {
        if ((item.bureau_rating || '').toLowerCase() !== reportsFilter.bureauRating.toLowerCase()) {
          return false
        }
      }

      // Account Mapping Status Filter
      if (reportsFilter.accountMapping !== 'ALL') {
        const isMapped = Boolean(item.account_id && item.account_name && item.account_name !== 'No Account')
        if (reportsFilter.accountMapping === 'MAPPED_ONLY' && !isMapped) {
          return false
        }
        if (reportsFilter.accountMapping === 'UNMAPPED_ONLY' && isMapped) {
          return false
        }
      }

      // Duplicate Filter (Reports)
      if (reportsFilter.duplicateFilter !== 'ALL') {
        const g = (item.gstin || '').trim().toUpperCase()
        const count = g ? reportsGstinCounts.get(g) || 0 : 0
        if (reportsFilter.duplicateFilter === 'DUPLICATES_ONLY' && count <= 1) {
          return false
        }
        if (reportsFilter.duplicateFilter === 'UNIQUE_ONLY' && count > 1) {
          return false
        }
      }

      // Bureau Score Slider Filter (minBureauScore 300-900)
      const score = parseBureauScore(item.bureau_rating)
      if (score !== null) {
        if (score < reportsFilter.minBureauScore) {
          return false
        }
      } else {
        // Record has no numeric bureau score (e.g. "Not Found" or "N/A")
        if (!reportsFilter.includeNoScore) {
          return false
        }
        if (reportsFilter.minBureauScore > 300 && !reportsFilter.includeNoScore) {
          return false
        }
      }

      // Last Updated Date Range
      if (reportsFilter.fromDate) {
        if (!item.last_updated) return false
        const itemDate = new Date(item.last_updated)
        const from = new Date(`${reportsFilter.fromDate}T00:00:00`)
        if (itemDate < from) return false
      }

      if (reportsFilter.toDate) {
        if (!item.last_updated) return false
        const itemDate = new Date(item.last_updated)
        const to = new Date(`${reportsFilter.toDate}T23:59:59.999`)
        if (itemDate > to) return false
      }

      return true
    })
  }, [data, reportsFilter])

  // Filtered tracker data
  const filteredTracker = useMemo(() => {
    return trackerData.filter((item) => {
      // GSTIN
      if (
        trackerFilter.gstin.trim() &&
        !item.gstin?.toLowerCase().includes(trackerFilter.gstin.trim().toLowerCase())
      ) {
        return false
      }

      // Reference ID
      if (
        trackerFilter.referenceId.trim() &&
        !item.reference_id?.toLowerCase().includes(trackerFilter.referenceId.trim().toLowerCase())
      ) {
        return false
      }

      // Report Status
      if (trackerFilter.reportStatus !== 'ALL') {
        if ((item.report_status || '').toLowerCase() !== trackerFilter.reportStatus.toLowerCase()) {
          return false
        }
      }

      // Duplicate Filter (Tracker)
      if (trackerFilter.duplicateFilter !== 'ALL') {
        const g = (item.gstin || '').trim().toUpperCase()
        const count = g ? trackerGstinCounts.get(g) || 0 : 0
        if (trackerFilter.duplicateFilter === 'DUPLICATES_ONLY' && count <= 1) {
          return false
        }
        if (trackerFilter.duplicateFilter === 'UNIQUE_ONLY' && count > 1) {
          return false
        }
      }

      // Created At Date Range
      if (trackerFilter.fromDate) {
        if (!item.created_at) return false
        const itemDate = new Date(item.created_at)
        const from = new Date(`${trackerFilter.fromDate}T00:00:00`)
        if (itemDate < from) return false
      }

      if (trackerFilter.toDate) {
        if (!item.created_at) return false
        const itemDate = new Date(item.created_at)
        const to = new Date(`${trackerFilter.toDate}T23:59:59.999`)
        if (itemDate > to) return false
      }

      return true
    })
  }, [trackerData, trackerFilter])

  // Pagination state (20 items per page)
  const ITEMS_PER_PAGE = 20
  const [reportsPage, setReportsPage] = useState(1)
  const [trackerPage, setTrackerPage] = useState(1)

  // Reset page when filters change
  useEffect(() => {
    setReportsPage(1)
  }, [reportsFilter])

  useEffect(() => {
    setTrackerPage(1)
  }, [trackerFilter])

  // Paginated slices
  const totalReportsPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE))
  const paginatedReports = useMemo(() => {
    const start = (reportsPage - 1) * ITEMS_PER_PAGE
    return filteredReports.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredReports, reportsPage])

  const totalTrackerPages = Math.max(1, Math.ceil(filteredTracker.length / ITEMS_PER_PAGE))
  const paginatedTracker = useMemo(() => {
    const start = (trackerPage - 1) * ITEMS_PER_PAGE
    return filteredTracker.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTracker, trackerPage])

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
      {/* Compact Top Bar: Title, Small KPI Counters & Actions in One Single Row */}
      <div className='flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs'>
        <div className='flex items-center gap-4 flex-wrap'>
          <div>
            <h1 className='text-lg font-bold tracking-tight text-slate-900'>
              GST & Cibil Reports
            </h1>
            <p className='text-xs text-slate-500'>
              Generated reports & tracker
            </p>
          </div>

          {/* Compact Inline KPI Badges (Clickable Filters) */}
          <div className='flex items-center gap-2 flex-wrap'>
            {/* Total Reports */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                activeTab === 'reports' &&
                reportsFilter.accountMapping === 'ALL' &&
                reportsFilter.duplicateFilter === 'ALL' &&
                activeReportsFilterCount === 0
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-slate-200/60'
              }`}
              onClick={() => {
                setActiveTab('reports')
                clearReportsFilters()
              }}
              title='Click to view all reports (clears reports filters)'
            >
              {activeTab === 'reports' &&
              reportsFilter.accountMapping === 'ALL' &&
              reportsFilter.duplicateFilter === 'ALL' &&
              activeReportsFilterCount === 0 ? (
                <Check className='h-3.5 w-3.5 text-white' />
              ) : (
                <FileSpreadsheet className='h-3.5 w-3.5 text-slate-500' />
              )}
              <span>Total Reports:</span>
              <span className='font-bold'>{reportsStats.totalReports}</span>
            </div>

            {/* Mapped to Account */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                reportsFilter.accountMapping === 'MAPPED_ONLY'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200/70'
              }`}
              onClick={() => {
                setActiveTab('reports')
                setReportsFilter((prev) => ({
                  ...prev,
                  accountMapping:
                    prev.accountMapping === 'MAPPED_ONLY' ? 'ALL' : 'MAPPED_ONLY',
                }))
              }}
              title='Click to filter reports mapped to an Account'
            >
              {reportsFilter.accountMapping === 'MAPPED_ONLY' ? (
                <Check className='h-3.5 w-3.5 text-white' />
              ) : (
                <Building2 className='h-3.5 w-3.5 text-emerald-600' />
              )}
              <span>Mapped to Account:</span>
              <span className='font-bold'>{reportsStats.mappedToAccount}</span>
            </div>

            {/* No Account Linked */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                reportsFilter.accountMapping === 'UNMAPPED_ONLY'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-600/30'
                  : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100/80 border-amber-200/70'
              }`}
              onClick={() => {
                setActiveTab('reports')
                setReportsFilter((prev) => ({
                  ...prev,
                  accountMapping:
                    prev.accountMapping === 'UNMAPPED_ONLY' ? 'ALL' : 'UNMAPPED_ONLY',
                }))
              }}
              title='Click to filter reports with No Account Linked'
            >
              {reportsFilter.accountMapping === 'UNMAPPED_ONLY' ? (
                <Check className='h-3.5 w-3.5 text-white' />
              ) : (
                <AlertCircle className='h-3.5 w-3.5 text-amber-600' />
              )}
              <span>No Account Linked:</span>
              <span className='font-bold'>{reportsStats.unmapped}</span>
            </div>

            {/* Unique Reports KPI */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                reportsFilter.duplicateFilter === 'UNIQUE_ONLY'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                  : 'bg-blue-50/70 text-blue-800 hover:bg-blue-100/70 border-blue-200/70'
              }`}
              onClick={() => {
                setActiveTab('reports')
                setReportsFilter((prev) => ({
                  ...prev,
                  duplicateFilter:
                    prev.duplicateFilter === 'UNIQUE_ONLY'
                      ? 'ALL'
                      : 'UNIQUE_ONLY',
                }))
              }}
              title='Click to filter unique reports (single instance GSTINs)'
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  reportsFilter.duplicateFilter === 'UNIQUE_ONLY'
                    ? 'text-white'
                    : 'text-blue-600'
                }`}
              />
              <span>Unique Reports:</span>
              <span className='font-bold'>{reportsStats.uniqueReportsCount}</span>
            </div>

            {/* Duplicate Reports KPI */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                reportsFilter.duplicateFilter === 'DUPLICATES_ONLY'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-600/30'
                  : reportsStats.duplicateReportsCount > 0
                    ? 'bg-rose-50 text-rose-800 hover:bg-rose-100/70 border-rose-200/70'
                    : 'bg-slate-50 text-slate-600 border-slate-200/60'
              }`}
              onClick={() => {
                setActiveTab('reports')
                setReportsFilter((prev) => ({
                  ...prev,
                  duplicateFilter:
                    prev.duplicateFilter === 'DUPLICATES_ONLY'
                      ? 'ALL'
                      : 'DUPLICATES_ONLY',
                }))
              }}
              title='Click to filter duplicate reports by GSTIN'
            >
              {reportsFilter.duplicateFilter === 'DUPLICATES_ONLY' ? (
                <Check className='h-3.5 w-3.5 text-white' />
              ) : (
                <Copy className='h-3.5 w-3.5 text-rose-600' />
              )}
              <span>Duplicate Reports:</span>
              <span className='font-bold'>{reportsStats.duplicateReportsCount}</span>
            </div>

            {/* Tracker Records */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                activeTab === 'tracker'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/60'
              }`}
              onClick={() => {
                setActiveTab('tracker')
                clearTrackerFilters()
              }}
              title='Click to switch to Reference Tracker tab'
            >
              {activeTab === 'tracker' ? (
                <Check className='h-3.5 w-3.5 text-white' />
              ) : (
                <Activity className='h-3.5 w-3.5 text-slate-400' />
              )}
              <span>Tracker Records:</span>
              <span className='font-bold'>{trackerData.length}</span>
              {reportsStats.duplicateTrackerCount > 0 && (
                <span
                  className={`text-[10px] font-semibold ${
                    activeTab === 'tracker' ? 'text-rose-200' : 'text-rose-600'
                  }`}
                >
                  ({reportsStats.duplicateTrackerCount} dups)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2.5'>
          {hasActiveFilters && (
            <Button
              variant='outline'
              size='sm'
              onClick={clearAllActiveFilters}
              className='flex items-center gap-1.5 h-8 text-xs border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50'
              title='Clear all active filters'
            >
              <X className='h-3.5 w-3.5' />
              <span>Clear Filters</span>
              <Badge
                variant='secondary'
                className='ml-0.5 px-1 py-0 text-[10px] bg-rose-100 text-rose-700 font-semibold rounded-full'
              >
                {activeTab === 'reports' ? activeReportsFilterCount : activeTrackerFilterCount}
              </Badge>
            </Button>
          )}

          <input
            ref={inputRef}
            type='file'
            accept='.csv, .xlsx, .xls'
            onChange={handleFile}
            className='hidden'
          />

          <Button
            size='sm'
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className='flex items-center gap-1.5 h-8 text-xs'
          >
            {isUploading ? (
              <>
                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <Upload className='h-3.5 w-3.5' />
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
                {activeReportsFilterCount > 0
                  ? `${filteredReports.length} / ${data.length}`
                  : data.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value='tracker'
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md shadow-none data-[state=active]:shadow-sm'
            >
              <Activity className='h-4 w-4' />
              Reference Tracker
              <Badge variant='secondary' className='ml-1 text-xs px-1.5 py-0'>
                {activeTrackerFilterCount > 0
                  ? `${filteredTracker.length} / ${trackerData.length}`
                  : trackerData.length}
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
          <Card className='shadow-sm flex flex-col h-[calc(100vh-210px)] min-h-[500px]'>
            <CardHeader className='border-b px-6 py-3 shrink-0'>
              <div className='flex items-center justify-between gap-4 flex-wrap'>
                <div className='flex items-center gap-3'>
                  <CardTitle className='text-base font-semibold'>
                    Generated Reports
                  </CardTitle>
                  {activeReportsFilterCount > 0 && (
                    <Badge variant='outline' className='text-xs bg-emerald-50 text-emerald-700 border-emerald-200'>
                      Filtered ({filteredReports.length} of {data.length})
                    </Badge>
                  )}
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant={showReportsFilters ? 'secondary' : 'outline'}
                    size='sm'
                    className='h-8 text-xs gap-1.5'
                    onClick={() => setShowReportsFilters((prev) => !prev)}
                  >
                    <Filter className='h-3.5 w-3.5' />
                    <span>Filter</span>
                    {activeReportsFilterCount > 0 && (
                      <Badge
                        variant='default'
                        className='ml-1 px-1.5 py-0 h-4 text-[10px] bg-slate-900 text-white rounded-full'
                      >
                        {activeReportsFilterCount}
                      </Badge>
                    )}
                  </Button>
                  {activeReportsFilterCount > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 text-xs text-slate-500 hover:text-slate-800'
                      onClick={clearReportsFilters}
                    >
                      <X className='h-3.5 w-3.5 mr-1' />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Reports Filter Panel */}
              {showReportsFilters && (
                <div className='mt-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-3.5 rounded-lg space-y-3 max-h-72 overflow-y-auto'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3'>
                    {/* GSTIN */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        GSTIN
                      </label>
                      <Input
                        placeholder='Filter GSTIN...'
                        className='h-8 text-xs bg-white'
                        value={reportsFilter.gstin}
                        onChange={(e) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            gstin: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Name */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Name
                      </label>
                      <Input
                        placeholder='Filter Name...'
                        className='h-8 text-xs bg-white'
                        value={reportsFilter.name}
                        onChange={(e) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Account */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Account
                      </label>
                      <Input
                        placeholder='Filter Account...'
                        className='h-8 text-xs bg-white'
                        value={reportsFilter.account}
                        onChange={(e) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            account: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Contact */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Contact
                      </label>
                      <Input
                        placeholder='Filter Contact...'
                        className='h-8 text-xs bg-white'
                        value={reportsFilter.contact}
                        onChange={(e) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            contact: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* GST Status */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        GST Status
                      </label>
                      <Select
                        value={reportsFilter.gstStatus}
                        onValueChange={(val) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            gstStatus: val,
                          }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs bg-white w-full'>
                          <SelectValue placeholder='All Statuses' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ALL'>All Statuses</SelectItem>
                          {reportsStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>


                    {/* Account Mapping Filter */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Account Link Status
                      </label>
                      <Select
                        value={reportsFilter.accountMapping}
                        onValueChange={(val) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            accountMapping: val,
                          }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs bg-white w-full'>
                          <SelectValue placeholder='All Link Status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ALL'>All Reports</SelectItem>
                          <SelectItem value='MAPPED_ONLY'>
                            Mapped to Account ({reportsStats.mappedToAccount})
                          </SelectItem>
                          <SelectItem value='UNMAPPED_ONLY'>
                            No Account Linked ({reportsStats.unmapped})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duplicate Reports Filter */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Duplicate Status
                      </label>
                      <Select
                        value={reportsFilter.duplicateFilter}
                        onValueChange={(val) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            duplicateFilter: val,
                          }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs bg-white w-full'>
                          <SelectValue placeholder='All Records' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ALL'>All Reports</SelectItem>
                          <SelectItem value='DUPLICATES_ONLY'>
                            Duplicates Only ({reportsStats.duplicateReportsCount})
                          </SelectItem>
                          <SelectItem value='UNIQUE_ONLY'>
                            Unique Only ({data.length - reportsStats.duplicateReportsCount})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Last Updated From Date */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Updated From
                      </label>
                      <Input
                        type='date'
                        className='h-8 text-xs bg-white'
                        value={reportsFilter.fromDate}
                        onChange={(e) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            fromDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Last Updated To Date */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Updated To
                      </label>
                      <Input
                        type='date'
                        className='h-8 text-xs bg-white'
                        value={reportsFilter.toDate}
                        onChange={(e) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            toDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Bureau Rating Score Slider Filter */}
                  <div className='pt-2.5 mt-1 border-t border-slate-200/60 bg-white p-2.5 rounded-md border space-y-1.5'>
                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-slate-700'>
                          Bureau Rating Minimum Score:
                        </span>
                        <span className='px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-900 text-white'>
                          {reportsFilter.minBureauScore === 300
                            ? 'All (≥ 300)'
                            : `≥ ${reportsFilter.minBureauScore}`}
                        </span>
                      </div>
                      <label className='inline-flex items-center gap-1.5 cursor-pointer text-slate-600 select-none text-xs'>
                        <input
                          type='checkbox'
                          className='rounded border-slate-300 text-slate-900 focus:ring-slate-950 h-3.5 w-3.5'
                          checked={reportsFilter.includeNoScore}
                          onChange={(e) =>
                            setReportsFilter((prev) => ({
                              ...prev,
                              includeNoScore: e.target.checked,
                            }))
                          }
                        />
                        <span>Include records without score</span>
                      </label>
                    </div>

                    <div className='px-1'>
                      <Slider
                        min={300}
                        max={900}
                        step={10}
                        value={[reportsFilter.minBureauScore]}
                        onValueChange={(val) =>
                          setReportsFilter((prev) => ({
                            ...prev,
                            minBureauScore: val[0] ?? 300,
                          }))
                        }
                      />
                      <div className='flex justify-between text-[10px] text-slate-400 font-mono mt-0.5'>
                        <span>300 (Poor)</span>
                        <span>550 (Average)</span>
                        <span>700 (Good)</span>
                        <span>750+ (Excellent)</span>
                        <span>900</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className='p-0 flex-1 overflow-auto relative'>
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
              ) : filteredReports.length === 0 ? (
                <div className='p-12 text-center text-slate-500 space-y-2'>
                  <p className='font-medium'>
                    {data.length === 0
                      ? 'No GST/Cibil reports found'
                      : 'No reports match the current filters'}
                  </p>
                  {activeReportsFilterCount > 0 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={clearReportsFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader className='border-b border-slate-200 sticky top-0 bg-white z-10 shadow-xs'>
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
                    {paginatedReports.map((item) => (
                      <TableRow
                        key={item.id}
                        className='cursor-pointer transition-colors hover:bg-slate-50/70'
                        onClick={() => handleRowClick(item.reference_id)}
                      >
                        <TableCell className='px-6 py-4 font-medium font-mono text-sm'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <span>{item.gstin}</span>
                            {item.gstin &&
                              item.gstin !== 'N/A' &&
                              (reportsGstinCounts.get(item.gstin.trim().toUpperCase()) || 0) > 1 && (
                                <Badge
                                  variant='outline'
                                  className='text-[10px] px-1.5 py-0 h-4 bg-rose-50 text-rose-700 border-rose-200 font-sans'
                                  title={`Duplicate GSTIN (${reportsGstinCounts.get(item.gstin.trim().toUpperCase())} reports)`}
                                >
                                  dup ({reportsGstinCounts.get(item.gstin.trim().toUpperCase())})
                                </Badge>
                              )}
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

            {/* Pagination Footer */}
            {filteredReports.length > 0 && (
              <div className='border-t border-slate-200 px-6 py-3 bg-slate-50/50 shrink-0'>
                <Pagination
                  currentPage={reportsPage}
                  totalPages={totalReportsPages}
                  onPageChange={setReportsPage}
                />
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: GST Reference Tracker */}
        <TabsContent value='tracker' className='mt-4 outline-none'>
          <Card className='shadow-sm flex flex-col h-[calc(100vh-210px)] min-h-[500px]'>
            <CardHeader className='border-b px-6 py-3 shrink-0'>
              <div className='flex items-center justify-between gap-4 flex-wrap'>
                <div className='flex items-center gap-3'>
                  <CardTitle className='text-base font-semibold'>
                    GST Reference Tracker
                  </CardTitle>
                  {activeTrackerFilterCount > 0 && (
                    <Badge variant='outline' className='text-xs bg-emerald-50 text-emerald-700 border-emerald-200'>
                      Filtered ({filteredTracker.length} of {trackerData.length})
                    </Badge>
                  )}
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant={showTrackerFilters ? 'secondary' : 'outline'}
                    size='sm'
                    className='h-8 text-xs gap-1.5'
                    onClick={() => setShowTrackerFilters((prev) => !prev)}
                  >
                    <Filter className='h-3.5 w-3.5' />
                    <span>Filter</span>
                    {activeTrackerFilterCount > 0 && (
                      <Badge
                        variant='default'
                        className='ml-1 px-1.5 py-0 h-4 text-[10px] bg-slate-900 text-white rounded-full'
                      >
                        {activeTrackerFilterCount}
                      </Badge>
                    )}
                  </Button>
                  {activeTrackerFilterCount > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 text-xs text-slate-500 hover:text-slate-800'
                      onClick={clearTrackerFilters}
                    >
                      <X className='h-3.5 w-3.5 mr-1' />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Tracker Filter Panel */}
              {showTrackerFilters && (
                <div className='mt-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-3.5 rounded-lg space-y-3 max-h-72 overflow-y-auto'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3'>
                    {/* GSTIN */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        GSTIN
                      </label>
                      <Input
                        placeholder='Filter GSTIN...'
                        className='h-8 text-xs bg-white'
                        value={trackerFilter.gstin}
                        onChange={(e) =>
                          setTrackerFilter((prev) => ({
                            ...prev,
                            gstin: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Reference ID */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Reference ID
                      </label>
                      <Input
                        placeholder='Filter Reference ID...'
                        className='h-8 text-xs bg-white'
                        value={trackerFilter.referenceId}
                        onChange={(e) =>
                          setTrackerFilter((prev) => ({
                            ...prev,
                            referenceId: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Report Status */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Report Status
                      </label>
                      <Select
                        value={trackerFilter.reportStatus}
                        onValueChange={(val) =>
                          setTrackerFilter((prev) => ({
                            ...prev,
                            reportStatus: val,
                          }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs bg-white w-full'>
                          <SelectValue placeholder='All Statuses' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ALL'>All Statuses</SelectItem>
                          {trackerStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duplicate Tracker Filter */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Duplicate Status
                      </label>
                      <Select
                        value={trackerFilter.duplicateFilter}
                        onValueChange={(val) =>
                          setTrackerFilter((prev) => ({
                            ...prev,
                            duplicateFilter: val,
                          }))
                        }
                      >
                        <SelectTrigger className='h-8 text-xs bg-white w-full'>
                          <SelectValue placeholder='All Records' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ALL'>All Submissions</SelectItem>
                          <SelectItem value='DUPLICATES_ONLY'>
                            Duplicates Only ({reportsStats.duplicateTrackerCount})
                          </SelectItem>
                          <SelectItem value='UNIQUE_ONLY'>
                            Unique Only ({trackerData.length - reportsStats.duplicateTrackerCount})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Created At From Date */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Created From
                      </label>
                      <Input
                        type='date'
                        className='h-8 text-xs bg-white'
                        value={trackerFilter.fromDate}
                        onChange={(e) =>
                          setTrackerFilter((prev) => ({
                            ...prev,
                            fromDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Created At To Date */}
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-slate-600'>
                        Created To
                      </label>
                      <Input
                        type='date'
                        className='h-8 text-xs bg-white'
                        value={trackerFilter.toDate}
                        onChange={(e) =>
                          setTrackerFilter((prev) => ({
                            ...prev,
                            toDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className='p-0 flex-1 overflow-auto relative'>
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
              ) : filteredTracker.length === 0 ? (
                <div className='p-12 text-center text-slate-500 space-y-2'>
                  <p className='font-medium'>
                    {trackerData.length === 0
                      ? 'No GST reference tracking records found'
                      : 'No records match the current filters'}
                  </p>
                  {activeTrackerFilterCount > 0 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={clearTrackerFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader className='border-b border-slate-200 sticky top-0 bg-white z-10 shadow-xs'>
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
                    {paginatedTracker.map((item) => (
                      <TableRow
                        key={item.id}
                        className=' transition-colors hover:bg-slate-50/70'
                      >
                        <TableCell className='px-6 py-4 font-mono font-medium text-sm'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <span>{item.gstin}</span>
                            {item.gstin &&
                              item.gstin !== 'N/A' &&
                              (trackerGstinCounts.get(item.gstin.trim().toUpperCase()) || 0) > 1 && (
                                <Badge
                                  variant='outline'
                                  className='text-[10px] px-1.5 py-0 h-4 bg-rose-50 text-rose-700 border-rose-200 font-sans'
                                  title={`Duplicate GSTIN (${trackerGstinCounts.get(item.gstin.trim().toUpperCase())} entries)`}
                                >
                                  dup ({trackerGstinCounts.get(item.gstin.trim().toUpperCase())})
                                </Badge>
                              )}
                          </div>
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

            {/* Pagination Footer */}
            {filteredTracker.length > 0 && (
              <div className='border-t border-slate-200 px-6 py-3 bg-slate-50/50 shrink-0'>
                <Pagination
                  currentPage={trackerPage}
                  totalPages={totalTrackerPages}
                  onPageChange={setTrackerPage}
                />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

