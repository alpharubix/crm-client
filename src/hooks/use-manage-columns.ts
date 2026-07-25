import { useState, useCallback, useEffect } from 'react'

export type TableColumn = {
  id: string
  label: string
  selected: boolean
}

export function useManageColumns(
  moduleName: string,
  defaultColumns: TableColumn[],
) {
  const getStorageKey = () => `columns-preferences-${moduleName}`

  const [columns, setColumns] = useState<TableColumn[]>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey())
      if (saved) {
        const parsed = JSON.parse(saved) as TableColumn[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedKeys = new Set(parsed.map((c) => c.id))
          const missingDefaults = defaultColumns.filter((c) => !savedKeys.has(c.id))
          
          const merged = parsed.map(savedCol => {
            const defaultCol = defaultColumns.find(d => d.id === savedCol.id)
            return defaultCol ? { ...defaultCol, selected: savedCol.selected } : savedCol
          })
          
          return [...merged, ...missingDefaults]
        }
      }
    } catch (error) {
      console.error('Failed to parse saved columns', error)
    }
    return defaultColumns
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey() && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as TableColumn[]
          setColumns(parsed)
        } catch (err) {
          // Ignore
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [moduleName])

  const savePreferences = useCallback(
    (newColumns: TableColumn[]) => {
      setColumns(newColumns)
      localStorage.setItem(getStorageKey(), JSON.stringify(newColumns))
    },
    [moduleName],
  )

  const resetToDefault = useCallback(() => {
    setColumns(defaultColumns)
    localStorage.removeItem(getStorageKey())
  }, [moduleName, defaultColumns])

  return {
    columns,
    savePreferences,
    resetToDefault,
  }
}
