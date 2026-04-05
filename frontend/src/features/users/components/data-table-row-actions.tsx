import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { CheckCircle, Trash2, UserPen, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const user = row.original

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[170px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(user)
            setOpen('edit')
          }}
        >
          Edit
          <DropdownMenuShortcut><UserPen size={16} /></DropdownMenuShortcut>
        </DropdownMenuItem>

        {user.status === 'pending' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('approve')
            }}
            className='text-teal-600!'
          >
            Approve
            <DropdownMenuShortcut><CheckCircle size={16} /></DropdownMenuShortcut>
          </DropdownMenuItem>
        )}

        {user.status === 'active' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('suspend')
            }}
            className='text-orange-500!'
          >
            Suspend
            <DropdownMenuShortcut><XCircle size={16} /></DropdownMenuShortcut>
          </DropdownMenuItem>
        )}

        {user.status === 'suspended' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('approve')
            }}
            className='text-teal-600!'
          >
            Reactivate
            <DropdownMenuShortcut><CheckCircle size={16} /></DropdownMenuShortcut>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(user)
            setOpen('delete')
          }}
          className='text-red-500!'
        >
          Delete
          <DropdownMenuShortcut><Trash2 size={16} /></DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
