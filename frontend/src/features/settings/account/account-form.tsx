import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, ChevronsUpDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { fetchActiveUsersApi, transferAdminRoleApi } from '../api/settings-api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function AccountForm() {
  const { auth } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['active-non-admin-users'],
    queryFn: fetchActiveUsersApi,
  })

  const transferMutation = useMutation({
    mutationFn: (targetId: number) => transferAdminRoleApi(targetId),
    onSuccess: (res) => {
      toast.success(res.message)
      // Current user is now a regular User — reset role in store
      if (auth.user) {
        auth.setUser({ ...auth.user, role: 'user' })
      }
      navigate({ to: '/chat' })
    },
    onError: (err) => handleServerError(err),
  })

  const selected = users.find((u) => u.id === selectedId)

  function handleTransfer() {
    if (selectedId) transferMutation.mutate(selectedId)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Transfer Admin Role</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          Assign the admin role to another active employee. You will become a regular user
          and lose access to the admin dashboard immediately.
        </p>
      </div>

      <div className='space-y-3'>
        <p className='text-sm font-medium'>Select employee</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open}
              className='w-full justify-between'
              disabled={isLoading}
            >
              {isLoading ? (
                <span className='flex items-center gap-2 text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' /> Loading employees...
                </span>
              ) : selected ? (
                `${selected.firstName} ${selected.lastName} — ${selected.title}`
              ) : (
                <span className='text-muted-foreground'>Search for an employee...</span>
              )}
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
            <Command>
              <CommandInput placeholder='Search by name or title...' />
              <CommandList>
                <CommandEmpty>No active employees found.</CommandEmpty>
                <CommandGroup>
                  {users.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={`${u.firstName} ${u.lastName} ${u.email} ${u.title}`}
                      onSelect={() => {
                        setSelectedId(u.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedId === u.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className='flex flex-col'>
                        <span>{u.firstName} {u.lastName}</span>
                        <span className='text-xs text-muted-foreground'>{u.title} · {u.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant='destructive'
          disabled={!selectedId || transferMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {transferMutation.isPending && <Loader2 className='animate-spin' />}
          Transfer admin role
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer admin role?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to transfer the admin role to{' '}
              <span className='font-semibold text-foreground'>
                {selected?.firstName} {selected?.lastName}
              </span>
              . You will immediately lose admin access and be redirected to the user dashboard.
              This cannot be undone without the new admin's help.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={handleTransfer}
            >
              Yes, transfer role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
