import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, Loader2, RefreshCw } from 'lucide-react'
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
import { ENV } from '@/conf'
import { formatCreationTimestamp } from '@/utils/date-formatter'

// Type for the GST/Cibil list item

interface GstCibilListItem {
  id: string
  gstin: string
  contact_number: string
  name: string
  reference_id: string
  report_status?: string
  request_stage?:string
  entity_status?:string
  bureau_rating?: string
  last_updated: string
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

export default function GstCibilPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<GstCibilListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [singleGstinput, setSingleGstInput] = useState('')

  const BaseURl =
    'https://gst-cibil-report-generator-backend-972437264901.asia-east1.run.app'

  const loadData = async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) setIsLoading(true)
      else setIsRefreshing(true)
      setError(null)

      const result = await fetchGstCibilData()
      setData(result)
    } catch (err: any) {
      setError(err?.message || 'Failed to load GST/Cibil data')
      console.error('Error loading data:', err)
      toast.error('Failed to load reports from database')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData(true)
  }, [])

  const singleGstUpload = async () => {
    if (!singleGstinput || singleGstinput.length !== 15) {
      toast.error('Invalid GST Number')
      return
    }

    const payload = {
      gstin_list: [singleGstinput],
    }

    const res = await fetch(`${BaseURl}/report/generate-reference-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer bb28adac-2792-4795-986d-4733d3ace634',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    // console.log(data.data.failed_gst_list[0].response_data.message)
    if (data.data.failed_gst_list.length > 0) {
      toast.error(
        `Submitision Failed - ${data.data.failed_gst_list[0].response_data.message}`,
      )
    } else {
      toast.success(
        `Submited Successfully! - ${data.data.passed_gst_list[0].response_data.message}`,
      )
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // 1. Parse CSV/Excel file using tabularjs
      const result = await tabularjs(file)

      // 2. Extract values strictly from the first column (index 0)
      const firstSheet = result.worksheets?.[0]
      const rows = firstSheet?.data || []

      const gstinList: string[] = []

      rows.forEach((row, index) => {
        if (!Array.isArray(row) || row.length === 0) return

        const firstCell = row[0]
        if (firstCell !== null && firstCell !== undefined) {
          const val = String(firstCell).trim()

          // Ignore empty strings
          if (!val) return

          // Skip header row if it's named something like "gst", "gstin", "gst number", etc.
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

      // 3. Construct backend payload
      const payload = {
        gstin_list: gstinList,
      }

      console.log('Sending GSTIN payload to backend:', payload)

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

    if (s.includes('active')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }

    if (s.includes('inactive') || s.includes('cancelled')) {
      return 'bg-red-100 text-red-700 border-red-200'
    }

    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <Spinner className='h-8 w-8' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-[60vh] flex-col gap-2'>
        <p className='text-red-600'>{error}</p>

        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className='mx-auto w-full animate-in fade-in zoom-in duration-300 px-4 py-4'>
      <div className='flex items-center gap-4 mb-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            GST & Cibil Reports
          </h1>

          <p className='text-sm text-slate-500'>
            View GST registration and Cibil bureau reports
          </p>
        </div>

        <div className='ml-auto'>
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

      <Card className='shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between border-b px-6 py-4'>
          <div className='flex items-center gap-3'>
            <CardTitle className='text-lg font-semibold'>
              Reports List
            </CardTitle>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              onClick={() => loadData(false)}
              disabled={isRefreshing || isLoading}
              title='Refresh reports'
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-600'}`}
              />
            </Button>
          </div>
          <div className='relative flex items-center w-60'>
            <Input
              className='w-full pr-16'
              placeholder='Enter a GST number...'
              onChange={(e) => setSingleGstInput(e.target.value)}
            />
            <Button
              variant='ghost'
              size='sm'
              className='absolute  cursor-pointer right-1 h-7 px-2 text-xs'
              onClick={() => singleGstUpload()}
            >
              Submit
            </Button>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {data.length === 0 ? (
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
                    Contact
                  </TableHead>

                  <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Report Status
                  </TableHead>

                  <TableHead className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                    Request Stage
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
                    className='cursor-pointer transition-colors'
                    onClick={() => handleRowClick(item.reference_id)}
                  >
                    <TableCell className='px-6 py-4 font-medium font-mono text-sm'>
                      {item.gstin}
                    </TableCell>

                    <TableCell className='px-6 py-4 text-sm '>
                      {item.name}
                    </TableCell>

                    <TableCell className='px-6 py-4 text-sm'>
                      {item.contact_number}
                    </TableCell>

                    <TableCell className='px-6 py-4'>
                      <Badge
                        className={`${getStatusBadgeStyle(
                          item.report_status,
                        )} border rounded-full px-3 py-0.5 text-xs font-medium`}
                      >
                        {item.report_status || 'N/A'}
                      </Badge>
                    </TableCell>


                    <TableCell className='px-6 py-4'>
                      <Badge
                        className={`${getStatusBadgeStyle(
                          item.request_stage,
                        )} border rounded-full px-3 py-0.5 text-xs font-medium`}
                      >
                        {item.request_stage || 'N/A'}
                      </Badge>
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

                    <TableCell className='px-6 py-4 text-sm'>
                      {item.bureau_rating || 'Not Available'}
                    </TableCell>

                    <TableCell className='px-6 py-4 text-sm'>
                      {formatCreationTimestamp(item.last_updated)}
                    </TableCell>

                    <TableCell className='px-6 py-4 text-right text-green-700 '>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation()

                          handleRowClick(item.reference_id)
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
  )
}
