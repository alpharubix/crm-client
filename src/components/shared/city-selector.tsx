import { useLocationData } from '@/hooks/use-location'
import { AutocompleteInput } from './autocomplete-input'

interface CitySelectorProps {
  label: string
  value: string
  onChange: (city: string) => void
  isEdit?: boolean
  placeholder?: string
}

export function CitySelector({
  label,
  value,
  onChange,
  isEdit = true,
  placeholder = 'Select City',
}: CitySelectorProps) {
  const { cities, searchCities } = useLocationData()

  return (
      <AutocompleteInput
        value={value}
        onValueChange={onChange}
        options={cities}
        placeholder={placeholder}
        label={label}
        isEdit={isEdit}
      />
  )
}
