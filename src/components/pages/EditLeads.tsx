import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { toast } from 'sonner'

type Lead = {
  id: string
  full_name: string
  phone_number: string
  email: string
  company: string
  city: string
  address: string
}

const leadFields = [
  { label: 'Name', name: 'full_name', type: 'text' },
  { label: 'Phone Number', name: 'phone_number', type: 'text' },
  { label: 'Email', name: 'email', type: 'email' },
  { label: 'Company', name: 'company', type: 'text' },
  { label: 'City', name: 'city', type: 'text' },
  { label: 'Address', name: 'address', type: 'text' },
] as const

const EditLeads = () => {
  const { id } = useParams<{ id: string }>()

  const initialState = leadFields.reduce((acc, field) => {
    acc[field.name] = ''
    return acc
  }, {} as Lead)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const [data, setData] = useState<Lead>(initialState)

  const fetchLeadsData = async () => {
    if (!id) return

    try {
      const res = await fetch(`http://localhost:8080/leads/${id}`)
      if (!res.ok) throw new Error('Failed to fetch lead')
      const result = await res.json()
      setData((prev) => ({ ...prev, ...result }))
    } catch (err: any) {
      toast.error(err)
    }
  }

  const editLead = async () => {
    if (!id) return

    try {
      const res = await fetch(`http://localhost:8080/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update lead')
      toast.success('Lead updated successfully',{
        duration: 2000,
      })
      const result = await res.json()
      setData((prev) => ({ ...prev, ...result }))
    } catch (err: any) {
      toast.error(err)
    }
  }

  useEffect(() => {
    fetchLeadsData()
  }, [id])

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-bold text-2xl">Edit Lead</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4">
        {leadFields.map((field) => (
          <div key={field.name}>
            <Label className="mb-3" htmlFor={field.name}>
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              value={data[field.name]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      <Button onClick={editLead} className="mt-4 w-fit">
        Update Lead
      </Button>
    </div>
  )
}

export default EditLeads
