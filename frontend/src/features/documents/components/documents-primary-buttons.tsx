import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocuments } from './documents-provider'

export function DocumentsPrimaryButtons() {
  const { setOpen } = useDocuments()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('upload')}>
        <span>Upload Document</span> <Upload size={18} />
      </Button>
    </div>
  )
}
