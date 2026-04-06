'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { handleServerError } from '@/lib/handle-server-error'
import { deleteDocument } from '../api/documents-api'
import { type PolicyDocument } from '../data/schema'

type DocumentsDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: PolicyDocument
}

export function DocumentsDeleteDialog({ open, onOpenChange, currentRow }: DocumentsDeleteDialogProps) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteDocument(currentRow.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setValue('')
      onOpenChange(false)
    },
    onError: (err) => handleServerError(err),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={() => deleteMutation.mutate()}
      disabled={value.trim() !== currentRow.originalName || deleteMutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle className='me-1 inline-block stroke-destructive' size={18} />
          Delete Document
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>{currentRow.originalName}</span>?
            <br />
            This will permanently remove it from the AI knowledge base and cannot be undone.
          </p>
          <Label className='my-2'>
            Document name:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Type the document name to confirm.'
            />
          </Label>
          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>This operation cannot be rolled back.</AlertDescription>
          </Alert>
        </div>
      }
      confirmText={deleteMutation.isPending ? <Loader2 className='animate-spin' /> : 'Delete'}
      destructive
    />
  )
}
