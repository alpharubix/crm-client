import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@/components/ui/label'
import usersData from '@/utils/users.json'

const usersList = Object.entries(usersData).map(([id, name]) => ({
  id,
  name: String(name),
}))

const noteSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, 'Description must be at least 2 characters'),
})

type NoteFormValues = z.infer<typeof noteSchema>

interface NoteDialogProps {
  onAddNote: (note: NoteFormValues) => void
}

export default function NoteDialog({ onAddNote }: NoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionedUsers, setMentionedUsers] = useState<
    { id: string; name: string }[]
  >([])

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    mode: 'onChange',
    defaultValues: {
      description: '',
    },
  })

  const description = watch('description')

  // Reset form when dialog opens/closes
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset()
      setMentionQuery(null)
      setMentionedUsers([])
    }
  }

  const onSubmit = (data: NoteFormValues) => {
    let finalDescription = data.description

    // Replace all "@name" with "crm[user#id]crm"
    mentionedUsers.forEach((user) => {
      // Use regex to replace exact name safely
      const regex = new RegExp(
        `@${user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'g',
      )
      finalDescription = finalDescription.replace(
        regex,
        `crm[user#${user.id}]crm`,
      )
    })

    onAddNote({ description: finalDescription })
    setOpen(false)
    reset()
    setMentionQuery(null)
    setMentionedUsers([])
  }

  const handleMentionSelect = (user: { id: string; name: string }) => {
    if (mentionStart === -1) return

    const before = description.substring(0, mentionStart)
    const exactEnd = textareaRef.current?.selectionStart || description.length
    const after = description.substring(exactEnd)

    const insertText = `@${user.name} `
    setValue('description', before + insertText + after, {
      shouldValidate: true,
      shouldDirty: true,
    })

    setMentionedUsers((prev) => {
      if (!prev.find((u) => u.id === user.id)) {
        return [...prev, user]
      }
      return prev
    })

    setMentionQuery(null)

    // Refocus and place cursor correctly
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newCursorPos = before.length + insertText.length
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const filteredUsers =
    mentionQuery !== null
      ? usersList.filter((u) =>
          u.name.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
      : []

  const {
    ref: formRef,
    onChange: formOnChange,
    ...restRegister
  } = register('description')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <div className='flex justify-center items-center'>
          <Button variant='outline' size='sm' className='cursor-pointer'>
            <Plus className='w-4 h-4 mr-2' /> Add Note
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] overflow-visible'>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>Add a new note to this record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className='grid gap-4 py-4'>
          <div className='grid gap-2 relative'>
            <Label htmlFor='description'>Description</Label>
            <div className='relative'>
              <Textarea
                id='description'
                placeholder='Note description'
                className={errors.description ? 'border-red-500' : ''}
                {...restRegister}
                ref={(e) => {
                  formRef(e)
                  textareaRef.current = e
                }}
                onChange={(e) => {
                  formOnChange(e)
                  const val = e.target.value
                  const cursor = e.target.selectionStart
                  const textBeforeCursor = val.substring(0, cursor)

                  // Match '@' preceded by space or start of string
                  const match = textBeforeCursor.match(
                    /(?:^|\s)@([a-zA-Z0-9 ]{0,30})$/,
                  )
                  if (match) {
                    setMentionQuery(match[1])
                    setMentionStart(cursor - match[1].length - 1)
                  } else {
                    setMentionQuery(null)
                  }
                }}
              />
              {mentionQuery !== null && filteredUsers.length > 0 && (
                <div className='absolute z-50 w-full max-h-40 overflow-y-auto bg-popover border rounded-md shadow-md mt-1 bottom-full mb-1'>
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className='px-3 py-2 cursor-pointer hover:bg-muted text-sm'
                      onClick={() => handleMentionSelect(user)}
                    >
                      {user.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.description && (
              <p className='text-sm text-red-500'>
                {errors.description.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type='submit'
              className='cursor-pointer'
              disabled={!isValid || isSubmitting}
            >
              Save Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
