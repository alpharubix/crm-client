import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@radix-ui/react-label'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddLeadDialog({ open, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    pan: '',
    gstin: '',
    company: '',
  })

  const handleInputChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveLead = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('http://localhost:8080/leads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Lead added successfully')
        onSuccess()
        onClose()
        setFormData({
          full_name: '',
          email: '',
          phone_number: '',
          pan: '',
          gstin: '',
          company: '',
        })
      } else {
        const err = await res.json()
        toast.error(err.detail)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the customer details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveLead} className="grid gap-4 py-4">
          {[
            ['full_name', 'Name'],
            ['email', 'Email'],
            ['phone_number', 'Phone'],
            ['pan', 'PAN'],
            ['gstin', 'GSTIN'],
          ].map(([name, label]) => (
            <div key={name} className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{label}</Label>
              <Input
                name={name}
                value={(formData as any)[name]}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
          ))}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
