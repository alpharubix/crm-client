import { AutocompleteInput } from './autocomplete-input'
import { useLocationData } from '@/hooks/use-location'

interface PincodeSelectorProps {
  value: string
  onChange: (pincode: string) => void
  isEdit?: boolean
  placeholder?: string
}

export function PincodeSelector({
  value,
  onChange,
  isEdit = true,
  placeholder = 'Enter Pincode',
}: PincodeSelectorProps) {
  const { pincodes } = useLocationData()

  return (
    <AutocompleteInput
      value={value}
      onValueChange={onChange}
      options={pincodes}
      placeholder={placeholder}
      isEdit={isEdit}
    />
  )
}
