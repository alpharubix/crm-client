import citiesData from '@/utils/cities.json'
import pincodesData from '@/utils/pincodes.json'
import { useAutocomplete } from './use-autocomplete-hook'
import statesData from '@/utils/states.json'

export function useCityAutocomplete() {
  return useAutocomplete({
    data: citiesData as string[],
    minChars: 2,
    maxResults: 50,
  })
}

export function useStateAutocomplete() {
  return useAutocomplete({
    data: statesData as string[],
    minChars: 2,
    maxResults: 50,
  })
}

export function usePincodeAutocomplete() {
  return useAutocomplete({
    data: pincodesData as string[],
    minChars: 2,
    maxResults: 50,
  })
}
