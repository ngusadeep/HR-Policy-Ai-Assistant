'use client'

import { useState } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { uploadDocument } from '../api/documents-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DocumentsUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentsUploadDialog({ open, onOpenChange }: DocumentsUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: (f: File) => uploadDocument(f),
    onSuccess: (doc) => {
      const msg =
        doc.status === 'indexed'
          ? `"${doc.originalName}" indexed — ${doc.chunkCount} chunks ready.`
          : `"${doc.originalName}" uploaded. Indexing in background — the status will update automatically.`
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setFile(null)
      onOpenChange(false)
    },
    onError: (err) => handleServerError(err),
  })

  const handleFile = (f: File) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown']
    if (!allowed.includes(f.type) && !f.name.endsWith('.md')) {
      toast.error('Only PDF, TXT, or Markdown files are supported.')
      return
    }
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Upload Policy Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, TXT, or Markdown file. It will be indexed into the AI knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className='py-2'>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('doc-file-input')?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              id='doc-file-input'
              type='file'
              accept='.pdf,.txt,.md'
              className='hidden'
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {file ? (
              <div className='flex items-center gap-2 text-sm'>
                <FileText className='h-5 w-5 text-primary' />
                <span className='max-w-50 truncate font-medium'>{file.name}</span>
                <button
                  type='button'
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className='ml-1 rounded-full p-0.5 hover:bg-muted'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            ) : (
              <>
                <Upload className='mb-2 h-8 w-8 text-muted-foreground' />
                <p className='text-sm font-medium'>Drag & drop or click to browse</p>
                <p className='mt-1 text-xs text-muted-foreground'>PDF, TXT, Markdown — max 20 MB</p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => file && uploadMutation.mutate(file)}
            disabled={!file || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <><Loader2 className='mr-2 h-4 w-4 animate-spin' /> Uploading…</>
            ) : (
              <><Upload className='mr-2 h-4 w-4' /> Upload & Index</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
