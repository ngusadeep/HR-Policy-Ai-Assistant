'use client'

import { useState } from 'react'
import { LogOut, UserCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ProfileForm } from '@/features/settings/profile/profile-form'

type ChatUserProfileProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatUserProfile({ open, onOpenChange }: ChatUserProfileProps) {
  const { auth } = useAuthStore()
  const [signOutOpen, setSignOutOpen] = useState(false)
  const user = auth.user

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side='right' className='flex w-full flex-col sm:max-w-lg overflow-y-auto px-8 py-8'>
          <SheetHeader className='pb-0'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-14 w-14 rounded-xl'>
                <AvatarFallback className='rounded-xl text-base font-semibold'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <SheetTitle className='truncate text-base'>
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </SheetTitle>
                <SheetDescription className='truncate text-sm'>
                  {user?.title ?? ''}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Separator className='my-6' />

          <div className='flex-1'>
            <h3 className='mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <UserCircle className='h-4 w-4' />
              My Profile &amp; Settings
            </h3>
            <ProfileForm />
          </div>

          <Separator className='my-6' />

          <Button
            variant='outline'
            className='w-full text-destructive hover:bg-destructive/10 hover:text-destructive'
            onClick={() => {
              onOpenChange(false)
              setSignOutOpen(true)
            }}
          >
            <LogOut className='mr-2 h-4 w-4' />
            Sign out
          </Button>
        </SheetContent>
      </Sheet>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  )
}
