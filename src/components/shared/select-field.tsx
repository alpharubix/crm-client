import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  value?: string
  isEdit: boolean
  options: string[]
  onChange: (value: string) => void
}

export default function SelectField({
  value,
  isEdit,
  options,
  onChange,
}: Props) {
  if (!isEdit) {
    return <span>{value || '—'}</span>
  }

  return (
    <Select value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger className='h-8'>
        <SelectValue placeholder='Select' />
      </SelectTrigger>

      <SelectContent>
        {options.map((opt, idx) => (
          <SelectItem key={`${opt}-${idx}`} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
