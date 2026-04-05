import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteUser } from '../api/users-api'
import { type User } from '../data/schema'

type Props<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'DELETE'

export function UsersMultiDeleteDialog<TData>({ open, onOpenChange, table }: Props<TData>) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const count = selectedRows.length

  const mutation = useMutation({
    mutationFn: () =>
      Promise.all(
        selectedRows.map((row) => deleteUser((row.original as User).id))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      table.resetRowSelection()
      setValue('')
      onOpenChange(false)
      toast.success(`Deleted ${count} ${count > 1 ? 'users' : 'user'}.`)
    },
    onError: (err) => handleServerError(err),
  })

  const handleDelete = () => {
    if (value.trim() !== CONFIRM_WORD) return
    mutation.mutate()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(s) => { setValue(''); onOpenChange(s) }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD || mutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle className='me-1 inline-block stroke-destructive' size={18} />
          Delete {count} {count > 1 ? 'users' : 'user'}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>Are you sure you want to delete the selected users? This cannot be undone.</p>
          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span>Confirm by typing &quot;{CONFIRM_WORD}&quot;:</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
            />
          </Label>
          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>This operation cannot be rolled back.</AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  )
}
