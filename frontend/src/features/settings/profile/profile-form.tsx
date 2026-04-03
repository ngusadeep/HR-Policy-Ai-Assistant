import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PasswordInput } from '@/components/password-input'
import { Separator } from '@/components/ui/separator'

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Surname must be at least 2 characters.'),
  email: z.email({ error: () => 'Please enter a valid email.' }),
  gender: z.enum(['male', 'female', 'prefer_not_to_say'], {
    error: () => 'Please select your gender.',
  }),
  title: z.string().min(2, 'Please enter your job title.'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password.'),
    newPassword: z.string().min(7, 'New password must be at least 7 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export function ProfileForm() {
  const { auth } = useAuthStore()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: auth.user?.firstName ?? '',
      lastName: auth.user?.lastName ?? '',
      email: auth.user?.email ?? '',
      gender: auth.user?.gender ?? undefined,
      title: auth.user?.title ?? '',
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  function onProfileSubmit(data: ProfileValues) {
    setProfileLoading(true)
    toast.promise(sleep(1200), {
      loading: 'Saving profile...',
      success: () => {
        setProfileLoading(false)
        auth.setUser(auth.user ? { ...auth.user, ...data } : null)
        return 'Profile updated successfully.'
      },
      error: () => { setProfileLoading(false); return 'Failed to update profile.' },
    })
  }

  function onPasswordSubmit(_data: PasswordValues) {
    setPasswordLoading(true)
    toast.promise(sleep(1200), {
      loading: 'Updating password...',
      success: () => {
        setPasswordLoading(false)
        passwordForm.reset()
        return 'Password updated successfully.'
      },
      error: () => { setPasswordLoading(false); return 'Failed to update password.' },
    })
  }

  return (
    <div className='space-y-8'>
      {/* Profile details */}
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={profileForm.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl><Input placeholder='John' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name='lastName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surname</FormLabel>
                  <FormControl><Input placeholder='Doe' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={profileForm.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input placeholder='name@company.com' {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={profileForm.control}
              name='gender'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder='Select...' /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='male'>Male</SelectItem>
                      <SelectItem value='female'>Female</SelectItem>
                      <SelectItem value='prefer_not_to_say'>Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
                  <FormControl><Input placeholder='e.g. Frontend Engineer' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type='submit' disabled={profileLoading}>
            {profileLoading && <Loader2 className='animate-spin' />}
            Save changes
          </Button>
        </form>
      </Form>

      <Separator />

      {/* Change password */}
      <div>
        <h3 className='mb-4 text-sm font-medium'>Change password</h3>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className='space-y-4'>
            <FormField
              control={passwordForm.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl><PasswordInput placeholder='••••••••' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl><PasswordInput placeholder='••••••••' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl><PasswordInput placeholder='••••••••' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled={passwordLoading}>
              {passwordLoading && <Loader2 className='animate-spin' />}
              Update password
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
