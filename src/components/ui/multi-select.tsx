'use client'

import * as React from 'react'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Command as CommandPrimitive } from 'cmdk'

export type Option = {
  value: string
  label: string
}

interface MultiSelectProps {
  options?: Option[]
  value?: Option[]
  selected?: Option[]
  onChange: (value: Option[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options = [],
  value,
  selected,
  onChange,
  placeholder = 'Select...',
  className,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const selectedList = value || selected || []
  const safeOptions = options || []

  const handleUnselect = (option: Option) => {
    onChange(selectedList.filter((item) => item.value !== option.value))
  }

  const selectables = React.useMemo(() => {
    return safeOptions
      .filter(
        (option) =>
          !selectedList.some((item) => item.value === option.value) &&
          (option.label || '').toLowerCase().includes(inputValue.toLowerCase()),
      )
      .slice(0, 20)
  }, [safeOptions, selectedList, inputValue])

  return (
    <Command shouldFilter={false} className='overflow-visible bg-transparent'>
      <div className={`group rounded-md border border-input px-1 py-1 text-xs h-9 flex items-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden bg-white dark:bg-input/30 ${className || ''}`}>
        <div
          className='flex flex-nowrap overflow-x-auto gap-1 w-full items-center'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.group div::-webkit-scrollbar { display: none; }`}</style>
          {selectedList.map((item) => (
            <Badge
              key={item.value}
              variant='secondary'
              className='whitespace-nowrap flex-shrink-0 font-normal'
            >
              {item.label}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnselect(item)
                }}
                className='ml-1 hover:text-red-500 transition-colors'
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          ))}

          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            placeholder={placeholder}
            className='ml-2 flex-1 bg-transparent outline-none min-w-[80px]'
          />
        </div>
      </div>

      <div className='relative mt-2'>
        <CommandList>
          {open && selectables.length > 0 && (
            <div className='absolute z-10 w-full rounded-md border bg-popover shadow-md'>
              <CommandGroup className='max-h-60 overflow-y-auto'>
                {selectables.map((option) => (
                  <CommandItem
                    key={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault()
                    }}
                    onSelect={() => {
                      onChange([...selectedList, option])
                      setInputValue('')
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          )}
        </CommandList>
      </div>
    </Command>
  )
}
