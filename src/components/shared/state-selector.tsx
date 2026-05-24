import { AutocompleteInput } from './autocomplete-input'
import { useLocationData } from '@/hooks/use-location'

interface StateSelectorProps {
  value: string
  onChange: (state: string) => void
  isEdit?: boolean
  placeholder?: string
  label: string
}

export function StateSelector({
  value,
  onChange,
  isEdit = true,
  label,
  placeholder = 'Select State',
}: StateSelectorProps) {
  const { states } = useLocationData()

  return (
    <AutocompleteInput
      label={label}
      value={value}
      onValueChange={onChange}
      options={states}
      placeholder={placeholder}
      isEdit={isEdit}
    />
  )
}
