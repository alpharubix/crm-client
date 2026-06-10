import React, { useState } from 'react'
import { Download, RotateCcw, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import users from '@/utils/users.json'
import { useQuery } from '@tanstack/react-query'
import { ENV } from '@/conf'
import { toast } from 'sonner'
import { Spinner } from '../ui/spinner'
import { MultiSelect, type Option } from '@/components/ui/multi-select'

const ExportCenter = () => {
  const [activeTab, setActiveTab] = useState('accounts')
  const [isExporting, setIsExporting] = useState(false)
  const [filters, setFilters] = useState({
    account_name: '',
    account_status: [] as Option[],
    account_stage: [] as Option[],
    source: [] as Option[],
    industry: [] as Option[],
    city: '',
    state: '',
    phone: '',
    account_owner_id: [] as Option[],
    callback_from: '',
    callback_to: '',
    lender_name: [] as Option[],
    case_status: [] as Option[],
    ticket_login: [] as Option[],
    loan_type: [] as Option[],
    type_of_case_login: [] as Option[],
    deal_owner_id: [] as Option[],
    mobile: '',
    email: '',
    full_name: '',
    module: [] as Option[],
    parent_id: '',
    owner_id: [] as Option[],
    created_from: '',
    created_to: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      account_name: '',
      account_status: [] as Option[],
      account_stage: [] as Option[],
      source: [] as Option[],
      industry: [] as Option[],
      city: '',
      state: '',
      phone: '',
      account_owner_id: [] as Option[],
      callback_from: '',
      callback_to: '',
      lender_name: [] as Option[],
      case_status: [] as Option[],
      ticket_login: [] as Option[],
      loan_type: [] as Option[],
      type_of_case_login: [] as Option[],
      deal_owner_id: [] as Option[],
      mobile: '',
      email: '',
      full_name: '',
      module: [] as Option[],
      parent_id: '',
      owner_id: [] as Option[],
      created_from: '',
      created_to: '',
    })
  }

  const accountStatuses = [
    'Yet to be dialed',
    'Wrong Number',
    'Contact Established',
    'Contact Not Established',
    'Awareness',
    'Attention',
    'Assessment',
    'Lender Review',
    'Not Interested',
    'Location Unserviceable',
  ]

  const accountStages = [
    'Initial Pitch',
    'Product Offering',
    'Doc List Shared to Cust',
    'Partial Docs Rec',
    'Yet To Review',
    'Under Internal Review',
    'In Review with Lender',
    'Interested',
    'Commercial NI',
    'Location not doable',
    'No Requirement',
  ]

  const sources = [
    'Himalaya',
    'CavinKare',
    'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA',
    'All India Hardware Association (Based in Mumbai Charni Road)',
    'Alpharubix',
    'Condor Footwear',
    'DVG Dist Petroleum',
    'Federation of Hotel and Restaurant Association of India (Based in New Delhi)',
    'Havells',
    'Liberty',
    'Marico',
    'Reference',
    'Retail Association of India',
    'SME CHAMBER',
    'Swastik',
    'Unicharm',
    'Vibhava Marketing',
    'R1X Website',
  ]

  const industries = [
    'Pharma',
    'AHP',
    'CPD',
    'FMCG',
    'OTX',
    'Footwear',
    'OTC',
    'RAAGA',
    'Hardware',
    'Electronics',
    'DVG Dist Petroleum',
  ]

  const ticketLogins = [
    'Approved',
    'Disapproved',
    'L1 Pendency',
    'L2 Pendency',
    'L3 Pendency',
    'Rejected',
  ]

  const dealStatuses = [
    'Yet to Lender Login',
    'Lender Review',
    'In Credit',
    'Approved',
    'Disbursed',
    'Rejected',
    'Not Interested',
  ]

  const lenderNames = [
    'Kotak Mahindra Bank Ltd',
    'Tyger Capital Private Ltd',
    'Profectus Capital Private Ltd',
    'Rupifi Private Ltd',
    'Niyogin Fintech Ltd',
    'Mintifi Finserve Private Limited',
    'Aditya Birla Capital Limited',
    'Muthoot Fincorp Limited',
    'FlexiLoans Technologies Pvt Ltd',
    'Hero Fincorp Ltd',
  ]

  const LOAN_TYPES = [
    'SCF',
    'SCF Renewal',
    'SCF Enhancement',
    'SCF (Renewal and Enhancement)',
    'Open SCF',
    'Open SCF Renewal',
    'Open SCF Enhancement',
    'Open SCF (Renewal and Enhancement)',
    'BT-SCF',
    'BT-Open SCF',
    'Unsecured OD',
    'Unsecured Term Loan',
    'Secured Loan',
    'Secured BT',
    'Vehicle Loan',
  ]

  const MODULE_NAMES = ['Accounts', 'Contacts', 'Deals']

  const typeOfCaseLogins = ['Fresh', 'Spillover']

  const ACCOUNT_STATUS_OPTIONS = accountStatuses.map((v) => ({
    value: v,
    label: v,
  }))

  const ACCOUNT_STAGE_OPTIONS = accountStages.map((v) => ({
    value: v,
    label: v,
  }))

  const SOURCE_OPTIONS = sources.map((v) => ({
    value: v,
    label: v,
  }))

  const INDUSTRY_OPTIONS = industries.map((v) => ({
    value: v,
    label: v,
  }))

  const TICKET_LOGIN_OPTIONS = ticketLogins.map((v) => ({
    value: v,
    label: v,
  }))

  const DEAL_STATUS_OPTIONS = dealStatuses.map((v) => ({
    value: v,
    label: v,
  }))

  const LENDER_NAME_OPTIONS = lenderNames.map((v) => ({
    value: v,
    label: v,
  }))

  const LOAN_TYPE_OPTIONS = LOAN_TYPES.map((v) => ({
    value: v,
    label: v,
  }))

  const TYPE_OF_CASE_LOGIN_OPTIONS = typeOfCaseLogins.map((v) => ({
    value: v,
    label: v,
  }))

  const MODULE_NAMES_OPTIONS = MODULE_NAMES.map((v) => ({
    value: v,
    label: v,
  }))

  const {
    data: ownerResponse,
    isSuccess,
    error,
  } = useQuery({
    queryKey: ['account-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })

      if (res.status === 403) {
        return { forbidden: true }
      }

      if (!res.ok) throw new Error('Failed')

      return res.json()
    },
    retry: false,
  })

  const owners = ownerResponse?.data ?? []

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            params.append(key, item.value)
          })
        } else if (value) {
          params.append(key, value)
        }
      })

      const url = `${ENV.VITE_BACKEND_BASE_URL}/export/${activeTab}?${params.toString()}`
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.detail)
        return
      }
      const blob = await response.blob()
      if (blob.size === 0) {
        toast.info('No records to export')
        return
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      toast.error('Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className='p-4'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-semibold '>Export center</h1>
          <p>Apply filters, then download your CSV. All fields are optional.</p>
        </div>
      </div>

      <Tabs
        defaultValue='accounts'
        className='w-full'
        onValueChange={(val) => {
          setActiveTab(val)
          clearFilters()
        }}
      >
        <TabsList className=' border-none p-1 h-12 mb-8'>
          {['Accounts', 'Deals', 'Contacts', 'Notes'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase()}
              className='px-6 rounded-md transition-all'
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card className=' shadow-2xl'>
          <CardHeader>
            <CardTitle className='text-xs uppercase tracking-widest font-bold'>
              FILTER {activeTab.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Grid for Inputs  */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {activeTab === 'accounts' && (
                <>
                  <div className='space-y-2'>
                    <Label className=''>Account name</Label>
                    <Input
                      placeholder='e.g. Ashok Pharmacy'
                      value={filters.account_name}
                      onChange={(e) =>
                        handleInputChange('account_name', e.target.value)
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>Status</Label>
                    <MultiSelect
                      options={ACCOUNT_STATUS_OPTIONS}
                      value={filters.account_status}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          account_status: val,
                        }))
                      }
                      placeholder='Select Status...'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>Stage</Label>
                    <MultiSelect
                      options={ACCOUNT_STAGE_OPTIONS}
                      value={filters.account_stage}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          account_stage: val,
                        }))
                      }
                      placeholder='Select Stage...'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>Source</Label>
                    <MultiSelect
                      options={SOURCE_OPTIONS}
                      value={filters.source}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          source: val,
                        }))
                      }
                      placeholder='Select Source...'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>Industry</Label>
                    <MultiSelect
                      options={INDUSTRY_OPTIONS}
                      value={filters.industry}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          industry: val,
                        }))
                      }
                      placeholder='Select Industry...'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>City</Label>
                    <Input
                      placeholder='e.g. Bangalore'
                      value={filters.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>State</Label>
                    <Input
                      placeholder='e.g. Karnataka'
                      value={filters.state}
                      onChange={(e) =>
                        handleInputChange('state', e.target.value)
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>Phone</Label>
                    <Input
                      placeholder='e.g. 98'
                      value={filters.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className=''>Owner</Label>
                    <MultiSelect
                      options={owners.map((owner: any) => ({
                        label: owner.full_name,
                        value: owner.id.toString(),
                      }))}
                      value={filters.account_owner_id}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          account_owner_id: val,
                        }))
                      }
                      placeholder='Select Owners...'
                    />
                  </div>

                  {/* Date Ranges [cite: 22, 53] */}
                  <div className='space-y-2'>
                    <Label>Callback from</Label>
                    <div className='relative'>
                      <Input
                        type='date'
                        className='pl-10'
                        value={filters.callback_from}
                        onChange={(e) =>
                          handleInputChange('callback_from', e.target.value)
                        }
                      />
                      <CalendarIcon className='absolute left-3 top-2.5 h-4 w-4' />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>Callback to</Label>
                    <div className='relative'>
                      <Input
                        type='date'
                        className='pl-10'
                        value={filters.callback_to}
                        onChange={(e) =>
                          handleInputChange('callback_to', e.target.value)
                        }
                      />
                      <CalendarIcon className='absolute left-3 top-2.5 h-4 w-4' />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'deals' && (
                <>
                  <div className='space-y-2'>
                    <Label>Account Name</Label>
                    <Input
                      placeholder='e.g. Ashok Pharmacy'
                      value={filters.account_name}
                      onChange={(e) =>
                        handleInputChange('account_name', e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Lender Name</Label>
                    <MultiSelect
                      options={LENDER_NAME_OPTIONS}
                      value={filters.lender_name}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          lender_name: val,
                        }))
                      }
                      placeholder='Select Lender...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Case Status</Label>
                    <MultiSelect
                      options={DEAL_STATUS_OPTIONS}
                      value={filters.case_status}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          case_status: val,
                        }))
                      }
                      placeholder='Select Case Status...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Ticket Login</Label>
                    <MultiSelect
                      options={TICKET_LOGIN_OPTIONS}
                      value={filters.ticket_login}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          ticket_login: val,
                        }))
                      }
                      placeholder='Select Ticket Login...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Loan Type</Label>
                    <MultiSelect
                      options={LOAN_TYPE_OPTIONS}
                      value={filters.loan_type}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          loan_type: val,
                        }))
                      }
                      placeholder='Select Status...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Type of Case Login</Label>
                    <MultiSelect
                      options={TYPE_OF_CASE_LOGIN_OPTIONS}
                      value={filters.type_of_case_login}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          type_of_case_login: val,
                        }))
                      }
                      placeholder='Select Type of Case Login...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Owner</Label>
                    <MultiSelect
                      options={owners.map((owner: any) => ({
                        label: owner.full_name,
                        value: owner.id.toString(),
                      }))}
                      value={filters.deal_owner_id}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          deal_owner_id: val,
                        }))
                      }
                      placeholder='Select Owners...'
                    />
                  </div>
                </>
              )}

              {activeTab === 'contacts' && (
                <>
                  <div className='space-y-2'>
                    <Label>Phone</Label>
                    <Input
                      placeholder='e.g. 9876543210'
                      value={filters.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Mobile</Label>
                    <Input
                      placeholder='e.g. 9876543210'
                      value={filters.mobile}
                      onChange={(e) =>
                        handleInputChange('mobile', e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>City</Label>
                    <Input
                      placeholder='e.g. Bangalore'
                      value={filters.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Email</Label>
                    <Input
                      placeholder='e.g. name@example.com'
                      value={filters.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Full Name / Last Name</Label>
                    <Input
                      placeholder='e.g. Kumar'
                      value={filters.full_name}
                      onChange={(e) =>
                        handleInputChange('full_name', e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {activeTab === 'notes' && (
                <>
                  <div className='space-y-2'>
                    <Label>Module</Label>
                    <MultiSelect
                      options={MODULE_NAMES_OPTIONS}
                      value={filters.module}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          module: val,
                        }))
                      }
                      placeholder='Select Modules...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Parent ID</Label>
                    <Input
                      placeholder='e.g. 1042'
                      value={filters.parent_id}
                      onChange={(e) =>
                        handleInputChange('parent_id', e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Owner</Label>
                    <MultiSelect
                      options={owners.map((owner: any) => ({
                        label: owner.full_name,
                        value: owner.id.toString(),
                      }))}
                      value={filters.owner_id}
                      onChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          owner_id: val,
                        }))
                      }
                      placeholder='Select Owners...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Created From</Label>
                    <div className='relative'>
                      <Input
                        type='date'
                        className='pl-10'
                        value={filters.created_from}
                        onChange={(e) =>
                          handleInputChange('created_from', e.target.value)
                        }
                      />
                      <CalendarIcon className='absolute left-3 top-2.5 h-4 w-4' />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label>Created To</Label>
                    <div className='relative'>
                      <Input
                        type='date'
                        className='pl-10'
                        value={filters.created_to}
                        onChange={(e) =>
                          handleInputChange('created_to', e.target.value)
                        }
                      />
                      <CalendarIcon className='absolute left-3 top-2.5 h-4 w-4' />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className='flex gap-4 pt-6 border-t'>
              <Button onClick={handleExport} className='font-semibold px-6'>
                {isExporting ? (
                  <>
                    <Spinner className='mr-2 h-4 w-4' />
                    Exporting... please wait
                  </>
                ) : (
                  <>
                    <Download className='mr-2 h-4 w-4' />
                    Download {activeTab}.csv
                  </>
                )}
              </Button>
              <Button variant='outline' onClick={clearFilters}>
                <RotateCcw className='mr-2 h-4 w-4' />
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

export default ExportCenter
