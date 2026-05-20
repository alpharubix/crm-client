import React from 'react'

type Props = {
  label: string | React.ReactNode
  error?: string
  children: React.ReactNode
}

export default function FieldRow({ label, error, children }: Props) {
  return (
    <div className="grid grid-cols-2 py-2.5 px-4 border-b items-start">
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <div>
        {children}
        {error && (
          <p className="text-xs text-destructive mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
