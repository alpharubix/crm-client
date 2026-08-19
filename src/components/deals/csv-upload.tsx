import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { Upload } from 'lucide-react'
import Dropzone, { type DropzoneState } from 'shadcn-dropzone'

import { ENV } from '@/conf'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { useState } from 'react'

const UploadCsv = ({
  isLoading,
  refetch,
}: {
  isLoading: boolean
  refetch: () => void
}) => {
  const [uploadLoading, setUploadLoading] = useState(false)
  const { user } = useAuth()

  const canUpload =
    user?.role?.toLowerCase().includes('admin') ||
    user?.role?.toLowerCase() === 'manager'

  return (
    <>
      <div className='flex gap-2'>
        {canUpload && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' className='cursor-pointer'>
                {isLoading || uploadLoading ? (
                  <Spinner className='h-4 w-4' />
                ) : (
                  <>
                    <Upload className='h-4 w-4 mr-2' />
                    Deals CSV Upload
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-30'>
              <Dropzone
                multiple={false}
                accept={{
                  'text/csv': ['.csv'],
                  'application/vnd.ms-excel': ['.csv'],
                }}
                onDrop={(acceptedFiles, fileRejections) => {
                  if (fileRejections.length) {
                    // console.log('Rejected:', fileRejections)
                    return
                  }

                  const file = acceptedFiles[0]

                  if (!file.name.toLowerCase().endsWith('.csv')) {
                    // console.log('Not a CSV file')
                    return
                  }

                  const asyncUpload = async () => {
                    try {
                      setUploadLoading(true)
                      const formData = new FormData()
                      formData.append('file', file)

                      const res = await fetch(
                        `${ENV.VITE_BACKEND_BASE_URL}/deals/deals-update-csv-upload`,
                        {
                          method: 'POST',
                          body: formData,
                          credentials: 'include',
                        },
                      )

                       if (!res.ok) {
                        const errData = await res.json().catch(() => ({}))
                        const errMsg =
                          typeof errData?.detail === 'string'
                            ? errData.detail
                            : errData?.detail?.message || 'Upload failed'
                        throw new Error(errMsg)
                      }

                      const data = await res.json()

                      data.row_errors.length > 0 &&
                        toast.error(`Total errors ${data.row_errors.length}`)
                      toast.success(
                        `Total inserted ${data.total_inserted} and total updated ${data.total_updated} deals`,
                      )
                    } catch (error: any) {
                      toast.error(error.message || 'Upload failed')
                    } finally {
                      setUploadLoading(false)
                    }
                  }
                  asyncUpload()
                }}
              >
                {(dropzone: DropzoneState) => (
                  <>
                    {uploadLoading ? (
                      <div className='flex items-center flex-col gap-1.5 cursor-not-allowed'>
                        <div className='flex items-center flex-row gap-0.5 text-sm font-medium'>
                          Uploading...
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center flex-col gap-1.5 cursor-pointer'>
                        <div className='flex items-center flex-row gap-0.5 text-sm font-medium'>
                          Upload files
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Dropzone>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </>
  )
}

export default UploadCsv
