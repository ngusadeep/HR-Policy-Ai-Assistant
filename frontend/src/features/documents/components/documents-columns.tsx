import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { statusStyles, categories } from '../data/data'
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Document Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64 ps-3'>{row.getValue('name')}</LongText>
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
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => {
      const cat = categories.find((c) => c.value === row.getValue('category'))
      return <div className='capitalize'>{cat?.label ?? row.getValue('category')}</div>
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableHiding: false,
    enableSorting: false,
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
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {status}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'pages',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Pages' />
    ),
    cell: ({ row }) => (
      <div className='text-center'>{row.getValue('pages')}</div>
    ),
    meta: { className: 'w-20' },
  },
  {
    accessorKey: 'fileSize',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Size' />
    ),
    cell: ({ row }) => <div>{row.getValue('fileSize')}</div>,
    enableSorting: false,
    meta: { className: 'w-24' },
  },
  {
    accessorKey: 'uploadedBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Uploaded By' />
    ),
    cell: ({ row }) => <div>{row.getValue('uploadedBy')}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'uploadedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Uploaded At' />
    ),
    cell: ({ row }) => {
      const date: Date = row.getValue('uploadedAt')
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
