// components/shared/autocomplete-input.tsx
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import FieldRow from './field-row'

interface AutocompleteInputProps {
  label?: string
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  isEdit?: boolean
  required?: boolean
  error?: string
  minChars?: number
}

export function AutocompleteInput({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Search...',
  isEdit = true,
  required = false,
  error,
  minChars = 1,
}: AutocompleteInputProps) {
  const [search, setSearch] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions =
    search?.length > minChars
      ? options
          .filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 50)
      : []

  useEffect(() => {
    setSearch(value)
  }, [value])

  if (!isEdit) {
    return (
      <FieldRow label={label} error={error}>
        <span>{value || '—'}</span>
      </FieldRow>
    )
  }

  return (
    <FieldRow label={label} error={error} required={required}>
      <div className='relative'>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
            onValueChange(e.target.value)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className='h-8'
        />
        {isOpen && filteredOptions.length > 0 && (
          <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
            {filteredOptions.map((opt) => (
              <div
                key={opt}
                className='p-2 hover:bg-muted cursor-pointer text-sm'
                onMouseDown={() => {
                  setSearch(opt)
                  setIsOpen(false)
                  onValueChange(opt)
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldRow>
  )
}
