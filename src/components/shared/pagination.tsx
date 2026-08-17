import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // Build visible page numbers — always show first, last, and window around current
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    pages.push(1)

    if (currentPage > 3) pages.push('ellipsis')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push('ellipsis')

    pages.push(totalPages)

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className='flex items-center justify-between'>
      <span className='text-xs text-muted-foreground'>
        Page <span className='font-medium text-foreground'>{currentPage}</span> of{' '}
        <span className='font-medium text-foreground'>{totalPages}</span>
      </span>

      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 cursor-pointer'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className='h-3.5 w-3.5' />
        </Button>

        {pages.map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className='px-1 text-xs text-muted-foreground select-none'>
              …
            </span>
          ) : (
            <Button
              key={page}
              variant='ghost'
              size='icon'
              className={cn(
                'h-7 w-7 text-xs font-medium cursor-pointer',
                page === currentPage
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 cursor-pointer'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )
}
