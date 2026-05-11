import { useState, useCallback } from 'react'

interface UseAutocompleteOptions {
  data: string[]
  minChars?: number
  maxResults?: number
}

export function useAutocomplete({
  data,
  minChars = 1,
  maxResults = 50,
}: UseAutocompleteOptions) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions =
    search.length > minChars
      ? data
          .filter((item) => item.toLowerCase().includes(search.toLowerCase()))
          .slice(0, maxResults)
      : []

  const handleSelect = useCallback((value: string) => {
    setSearch(value)
    setIsOpen(false)
  }, [])

  const handleChange = useCallback((value: string) => {
    setSearch(value)
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setTimeout(() => setIsOpen(false), 200)
  }, [])

  const handleOpen = useCallback(() => {
    if (search.length > minChars) {
      setIsOpen(true)
    }
  }, [search.length, minChars])

  return {
    search,
    setSearch: handleChange,
    isOpen,
    setIsOpen,
    filteredOptions,
    handleSelect,
    handleClose,
    handleOpen,
  }
}
