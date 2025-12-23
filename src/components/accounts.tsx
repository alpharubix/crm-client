import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { Lead } from '@/types'
import { Label } from '@radix-ui/react-label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatDateExact } from '@/utils/dateFormatter'

export default function LeadsPage() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    pan: '',
    gstin: '',
    company: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/leads/')
      if (res.ok) {
        const data = await res.json()
        console.log("data", data);
        
        setLeads(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch leads', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSaveLead = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)

    const url = 'http://localhost:8080/leads/'

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsDialogOpen(false)
        fetchLeads()
        setFormData({
          full_name: '',
          email: '',
          phone_number: '',
          pan: '',
          gstin: '',
          company: '',
        })
        toast.success('Lead added successfully')
      } else {
        const err = await res.json()
        toast.error('Error: ' + err.detail)
      }
    } catch (error) {
      console.error(error)
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Accounts Database
          </h1>
          <p className="text-muted-foreground">Manage your accounts here.</p>
        </div>

        <div className="flex gap-2">
          {/* Refresh Button */}
          <Button variant="outline" size="icon" onClick={fetchLeads}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Add Lead Modal Trigger */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-full gap-2"
                onClick={() => {
                  setFormData({
                    full_name: '',
                    email: '',
                    phone_number: '',
                    pan: '',
                    gstin: '',
                    company: '',
                  })
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" /> Add Account
              </Button>
            </DialogTrigger>

            {/* --- MODAL CONTENT --- */}
            <DialogContent
              onOpenAutoFocus={(e) => {
                e.preventDefault()
                document.getElementById('dialog-content')?.focus()
              }}
              id="dialog-content"
              tabIndex={-1}
              className="sm:max-w-[425px] outline-none"
            >
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Enter the customer details below. Click save to add to
                  database.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveLead} className="grid gap-4 py-4 ">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone_number" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                {/* Extra fields for Tax ID */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pan" className="text-right">
                    PAN
                  </Label>
                  <Input
                    id="pan"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="ABCDE1234F"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gstin" className="text-right">
                    GSTIN
                  </Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="GSTIN..."
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="border rounded-md p-2">
        <Table>
          <TableCaption>A list of recent leads.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Tax Details</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No leads found. Add one!
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <TableCell className="font-medium">{lead.id}</TableCell>
                  <TableCell className="font-medium">
                    <div>{lead.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Industry: {lead.industry || 'Individual'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {lead.phone_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">PAN: {lead.pan || '-'}</div>
                    <div className="text-xs">GST: {lead.gstin || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      Created on : {formatDateExact(lead.created_at) || 'New'}
                    </div>
                    <div className="text-xs">
                      Updated on : {formatDateExact(lead.updated_at) || 'New'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {lead.business_status || 'New'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
