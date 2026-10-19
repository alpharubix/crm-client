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

  const clampToMaxSelected = (cols: TableColumn[], max: number = 10): TableColumn[] => {
    let count = 0
    return cols.map((col) => {
      if (col.selected) {
        if (count < max) {
          count++
          return col
        }
        return { ...col, selected: false }
      }
      return col
    })
  }

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
          
          return clampToMaxSelected([...merged, ...missingDefaults], 10)
        }
      }
    } catch (error) {
      console.error('Failed to parse saved columns', error)
    }
    return clampToMaxSelected(defaultColumns, 10)
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey() && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as TableColumn[]
          setColumns(clampToMaxSelected(parsed, 10))
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
      const clamped = clampToMaxSelected(newColumns, 10)
      setColumns(clamped)
      localStorage.setItem(getStorageKey(), JSON.stringify(clamped))
    },
    [moduleName],
  )

  const resetToDefault = useCallback(() => {
    const clamped = clampToMaxSelected(defaultColumns, 10)
    setColumns(clamped)
    localStorage.removeItem(getStorageKey())
  }, [moduleName, defaultColumns])

  return {
    columns,
    savePreferences,
    resetToDefault,
  }
}
