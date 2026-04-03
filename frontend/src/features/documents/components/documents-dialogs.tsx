import { DocumentsUploadDialog } from './documents-upload-dialog'
import { DocumentsDeleteDialog } from './documents-delete-dialog'
import { useDocuments } from './documents-provider'

export function DocumentsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useDocuments()

  return (
    <>
      <DocumentsUploadDialog
        key='doc-upload'
        open={open === 'upload'}
        onOpenChange={() => setOpen('upload')}
      />

      {currentRow && (
        <DocumentsDeleteDialog
          key={`doc-delete-${currentRow.id}`}
          open={open === 'delete'}
          onOpenChange={() => {
            setOpen('delete')
            setTimeout(() => setCurrentRow(null), 500)
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
