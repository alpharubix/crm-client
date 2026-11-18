import React from 'react'

interface HighlightedTextProps {
  text: string | null | undefined
  highlight:
    | string
    | string[]
    | { value: string; label: string }[]
    | null
    | undefined
  className?: string
}

export default function HighlightedText({
  text,
  highlight,
  className = 'bg-yellow-200 text-black rounded-sm px-0.5',
}: HighlightedTextProps) {
  if (!text) return <span className='text-muted-foreground'>—</span>

  let words: string[] = []
  if (Array.isArray(highlight)) {
    words = highlight
      .map((item) =>
        typeof item === 'string' ? item : item?.value || item?.label,
      )
      .filter(
        (w): w is string =>
          Boolean(w && typeof w === 'string' && w.trim().length > 0),
      )
  } else if (typeof highlight === 'string' && highlight.trim() !== '') {
    words = [highlight.trim()]
  }

  if (words.length === 0) return <span>{text}</span>

  const escaped = words
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className={className}>
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  )
}
