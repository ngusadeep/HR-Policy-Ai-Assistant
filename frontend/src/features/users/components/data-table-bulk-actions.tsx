import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { updateUserStatus } from '../api/users-api'
import { type User } from '../data/schema'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const count = selectedRows.length

  const statusMutation = useMutation({
    mutationFn: (status: 'active' | 'suspended') =>
      Promise.all(
        selectedRows.map((row) => updateUserStatus((row.original as User).id, status))
      ),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      table.resetRowSelection()
      toast.success(
        status === 'active'
          ? `Approved ${count} ${count > 1 ? 'users' : 'user'}.`
          : `Suspended ${count} ${count > 1 ? 'users' : 'user'}.`
      )
    },
    onError: (err) => handleServerError(err),
  })

  return (
    <>
      <BulkActionsToolbar table={table} entityName='user'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate('active')}
              aria-label='Approve selected users'
            >
              <UserCheck />
              <span className='sr-only'>Approve selected users</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Approve selected</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate('suspended')}
              aria-label='Suspend selected users'
            >
              <UserX />
              <span className='sr-only'>Suspend selected users</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Suspend selected</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              className='size-8'
              onClick={() => setShowDeleteConfirm(true)}
              aria-label='Delete selected users'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected users</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Delete selected</p></TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
