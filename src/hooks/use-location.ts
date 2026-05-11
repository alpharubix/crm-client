import { useEffect, useState } from 'react'
import citiesData from '@/utils/cities.json'
import statesData from '@/utils/states.json'
import pincodesData from '@/utils/pincodes.json'

export function useLocationData() {
  const [cities, setCities] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [pincodes, setPincodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCities(citiesData as string[])
    setStates(statesData as string[])
    setPincodes(pincodesData as string[])
    setLoading(false)
  }, [])

  // Search functions for autocomplete
  const searchCities = (searchTerm: string): string[] => {
    if (!searchTerm) return cities.slice(0, 100)
    return cities
      .filter((city) => city.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 100)
  }

  const searchStates = (searchTerm: string): string[] => {
    if (!searchTerm) return states.slice(0, 100)
    return states
      .filter((state) => state.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 100)
  }

  const searchPincodes = (searchTerm: string): string[] => {
    if (!searchTerm) return pincodes.slice(0, 100)
    return pincodes
      .filter((pincode) => pincode.includes(searchTerm))
      .slice(0, 100)
  }

  return {
    cities,
    states,
    pincodes,
    loading,
    searchCities,
    searchStates,
    searchPincodes,
  }
}
