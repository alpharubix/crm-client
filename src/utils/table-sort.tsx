import React, { useState, useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type DateSortOrder = 'asc' | 'desc' | null

export const isDateColumn = (colId: string, label: string = ''): boolean => {
  const id = colId.toLowerCase()
  const lbl = label.toLowerCase()
  return (
    id.includes('date') ||
    id.includes('time') ||
    id.endsWith('_at') ||
    id.includes('closing') ||
    lbl.includes('date') ||
    lbl.includes('time') ||
    lbl.endsWith(' at') ||
    lbl.includes('closing')
  )
}

export const parseDateValue = (val: any): number => {
  if (val === null || val === undefined || val === '' || val === '—' || val === '-') {
    return 0
  }
  if (val instanceof Date) return val.getTime()
  if (typeof val === 'number') return val
  const str = String(val).trim()
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.getTime()

  // Try dd-mm-yyyy or dd/mm/yyyy
  const ddmmyyyyMatch = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
  if (ddmmyyyyMatch) {
    const [_, day, month, year] = ddmmyyyyMatch
    const parsed = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    )
    if (!isNaN(parsed.getTime())) return parsed.getTime()
  }
  return 0
}

export const sortRecordsByDate = <T,>(
  records: T[],
  sortField: string | null,
  sortOrder: DateSortOrder,
): T[] => {
  if (!sortField || !sortOrder) return records
  return [...records].sort((a: any, b: any) => {
    const valA = parseDateValue(a[sortField])
    const valB = parseDateValue(b[sortField])
    // Missing dates pushed to end
    if (valA === 0 && valB !== 0) return 1
    if (valB === 0 && valA !== 0) return -1
    if (valA === 0 && valB === 0) return 0
    if (sortOrder === 'asc') {
      return valA - valB
    }
    return valB - valA
  })
}

export function useDateSort<T>(records: T[] = []) {
  const safeRecords = Array.isArray(records) ? records : []
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<DateSortOrder>(null)

  const toggleSort = (colId: string) => {
    if (sortField !== colId) {
      setSortField(colId)
      setSortOrder('desc') // latest first
    } else if (sortOrder === 'desc') {
      setSortOrder('asc') // earliest first
    } else if (sortOrder === 'asc') {
      setSortField(null)
      setSortOrder(null)
    } else {
      setSortOrder('desc')
    }
  }

  const sortedRecords = useMemo(() => {
    return sortRecordsByDate(safeRecords, sortField, sortOrder)
  }, [safeRecords, sortField, sortOrder])

  return {
    sortField,
    sortOrder,
    toggleSort,
    sortedRecords,
    sortedData: sortedRecords,
    sortConfig: { field: sortField, order: sortOrder },
    requestSort: toggleSort,
  }
}

export function SortableDateHeader({
  label,
  colId,
  columnId,
  isDate,
  sortField,
  sortOrder,
  sortConfig,
  onToggle,
  onSort,
}: {
  label: string
  colId?: string
  columnId?: string
  isDate?: boolean
  sortField?: string | null
  sortOrder?: DateSortOrder
  sortConfig?: { field: string | null; order: DateSortOrder }
  onToggle?: (colId: string) => void
  onSort?: (colId: string) => void
}) {
  const actualColId = columnId || colId || ''
  const isDateCol = isDate !== undefined ? isDate : isDateColumn(actualColId, label)
  const currentField = sortField !== undefined ? sortField : sortConfig?.field ?? null
  const currentOrder = sortOrder !== undefined ? sortOrder : sortConfig?.order ?? null
  const handleToggle = onSort || onToggle || (() => {})

  if (!isDateCol) {
    return <span>{label}</span>
  }

  const isCurrentSort = currentField === actualColId
  return (
    <button
      type='button'
      onClick={(e) => {
        e.stopPropagation()
        handleToggle(actualColId)
      }}
      className={`inline-flex items-center gap-1.5 font-semibold text-xs transition-colors hover:text-foreground cursor-pointer group select-none ${
        isCurrentSort ? 'text-primary' : 'text-muted-foreground'
      }`}
      title={
        isCurrentSort
          ? currentOrder === 'desc'
            ? 'Sorted: Latest first (Click for Earliest first)'
            : 'Sorted: Earliest first (Click to Clear)'
          : 'Click to sort descending (latest first)'
      }
    >
      <span>{label}</span>
      {isCurrentSort ? (
        currentOrder === 'desc' ? (
          <ArrowDown className='h-3.5 w-3.5 text-primary' />
        ) : (
          <ArrowUp className='h-3.5 w-3.5 text-primary' />
        )
      ) : (
        <ArrowUpDown className='h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity' />
      )}
    </button>
  )
}
