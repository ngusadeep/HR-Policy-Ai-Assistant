import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { statusStyles, formatBytes } from '../data/data'
import { type PolicyDocument } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const documentsColumns: ColumnDef<PolicyDocument>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'originalName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Document Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64 ps-3'>{row.getValue('originalName')}</LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.status
      const badgeColor = statusStyles.get(status)
      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'chunkCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Chunks' />
    ),
    cell: ({ row }) => (
      <div className='text-center tabular-nums'>{row.getValue('chunkCount')}</div>
    ),
    meta: { className: 'w-20' },
  },
  {
    accessorKey: 'size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Size' />
    ),
    cell: ({ row }) => (
      <div className='tabular-nums'>{formatBytes(row.getValue('size'))}</div>
    ),
    enableSorting: false,
    meta: { className: 'w-24' },
  },
  {
    id: 'uploadedBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Uploaded By' />
    ),
    cell: ({ row }) => {
      const u = row.original.uploadedBy
      return <div>{u ? `${u.firstName} ${u.lastName}` : '—'}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Uploaded At' />
    ),
    cell: ({ row }) => {
      const date: Date = row.getValue('createdAt')
      return (
        <div className='text-nowrap text-sm text-muted-foreground'>
          {date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
