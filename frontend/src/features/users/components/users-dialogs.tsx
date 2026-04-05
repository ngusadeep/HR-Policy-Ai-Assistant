import { useUsers } from './users-provider'
import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'
import { UsersStatusDialog } from './users-status-dialog'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()

  const closeWithDelay = (dialog: typeof open) => () => {
    setOpen(dialog)
    setTimeout(() => setCurrentRow(null), 500)
  }

  return (
    <>
      <UsersActionDialog
        key='user-add'
        open={open === 'add'}
        onOpenChange={() => setOpen(open === 'add' ? null : 'add')}
      />

      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={closeWithDelay('edit')}
            currentRow={currentRow}
          />

          <UsersStatusDialog
            key={`user-approve-${currentRow.id}`}
            open={open === 'approve'}
            onOpenChange={closeWithDelay('approve')}
            currentRow={currentRow}
            action='approve'
          />

          <UsersStatusDialog
            key={`user-suspend-${currentRow.id}`}
            open={open === 'suspend'}
            onOpenChange={closeWithDelay('suspend')}
            currentRow={currentRow}
            action='suspend'
          />

          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={closeWithDelay('delete')}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
