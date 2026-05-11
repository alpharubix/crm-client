import { useLocationData } from '@/hooks/use-location'
import { AutocompleteInput } from './autocomplete-input'

interface CitySelectorProps {
  value: string
  onChange: (city: string) => void
  isEdit?: boolean
  placeholder?: string
}

export function CitySelector({
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
      isEdit={isEdit}
    />
  )
}
