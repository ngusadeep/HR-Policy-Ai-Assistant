import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { CheckCircle, XCircle } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { updateUserStatus } from '../api/users-api'
import { type User } from '../data/schema'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
  action: 'approve' | 'suspend'
}

export function UsersStatusDialog({ open, onOpenChange, currentRow, action }: Props) {
  const queryClient = useQueryClient()
  const isApprove = action === 'approve'

  const mutation = useMutation({
    mutationFn: () =>
      updateUserStatus(currentRow.id, isApprove ? 'active' : 'suspended'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(
        isApprove
          ? `${currentRow.firstName} ${currentRow.lastName} has been approved.`
          : `${currentRow.firstName} ${currentRow.lastName} has been suspended.`
      )
      onOpenChange(false)
    },
    onError: (err) => handleServerError(err),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={() => mutation.mutate()}
      disabled={mutation.isPending}
      title={
        <span className={isApprove ? 'text-teal-600' : 'text-orange-500'}>
          {isApprove ? (
            <CheckCircle className='me-1 inline-block' size={18} />
          ) : (
            <XCircle className='me-1 inline-block' size={18} />
          )}
          {isApprove ? 'Approve User' : 'Suspend User'}
        </span>
      }
      desc={
        isApprove ? (
          <p>
            Are you sure you want to approve{' '}
            <span className='font-semibold'>
              {currentRow.firstName} {currentRow.lastName}
            </span>
            ? They will be able to sign in immediately.
          </p>
        ) : (
          <p>
            Are you sure you want to suspend{' '}
            <span className='font-semibold'>
              {currentRow.firstName} {currentRow.lastName}
            </span>
            ? They will no longer be able to sign in.
          </p>
        )
      }
      confirmText={isApprove ? 'Approve' : 'Suspend'}
      destructive={!isApprove}
    />
  )
}
