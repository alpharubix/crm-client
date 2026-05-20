import React from 'react'

type MultiSelectFieldProps = {
  value: string[]
  options: string[]
  onChange: (value: string[]) => void
}

export default function MultiSelectField({
  value,
  options,
  onChange,
}: MultiSelectFieldProps) {
  const toggleItem = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((i) => i !== item))
    } else {
      onChange([...value, item])
    }
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {options.map((opt) => (
        <button
          key={opt}
          type='button'
          onClick={() => toggleItem(opt)}
          className={`px-3 py-1 rounded-full border text-[10px] font-bold transition-all ${
            value.includes(opt)
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-zinc-500 border-zinc-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
