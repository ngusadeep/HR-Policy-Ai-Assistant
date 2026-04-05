import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { roles } from '../data/data'
import { type User } from '../data/schema'

const formSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    email: z.email({ error: (i) => (i.input === '' ? 'Email is required.' : undefined) }),
    gender: z.enum(['male', 'female', 'prefer_not_to_say'], {
      error: () => 'Please select a gender.',
    }),
    title: z.string().min(1, 'Job title is required.'),
    role: z.string().min(1, 'Role is required.'),
    password: z.string().transform((p) => p.trim()),
    confirmPassword: z.string().transform((p) => p.trim()),
    isEdit: z.boolean(),
  })
  .refine((d) => (d.isEdit && !d.password) || d.password.length > 0, {
    message: 'Password is required.',
    path: ['password'],
  })
  .refine((d) => (d.isEdit && !d.password) || d.password.length >= 7, {
    message: 'Password must be at least 7 characters.',
    path: ['password'],
  })
  .refine((d) => (d.isEdit && !d.password) || d.password === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

type UserForm = z.infer<typeof formSchema>

type Props = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          firstName: currentRow.firstName,
          lastName: currentRow.lastName,
          email: currentRow.email,
          gender: currentRow.gender,
          title: currentRow.title,
          role: currentRow.role?.name ?? '',
          password: '',
          confirmPassword: '',
          isEdit: true,
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          gender: undefined,
          title: '',
          role: '',
          password: '',
          confirmPassword: '',
          isEdit: false,
        },
  })

  const mutation = useMutation({
    mutationFn: async (values: UserForm) => {
      const roleObj = await api.get<{ data: { id: number; name: string }[] }>('/roles')
      const roleId = roleObj.data.data.find((r) => r.name === values.role)?.id

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        gender: values.gender,
        title: values.title,
        ...(roleId ? { roleId } : {}),
        ...(values.password ? { password: values.password } : {}),
      }

      if (isEdit) {
        await api.patch(`/users/${currentRow.id}`, payload)
      } else {
        await api.post('/users', { ...payload, password: values.password })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(isEdit ? 'User updated successfully.' : 'User created successfully.')
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const msg = err.response.data?.message as string | undefined
        form.setError('email', { message: msg ?? 'Email already exists.' })
      } else {
        handleServerError(err)
      }
    },
  })

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog open={open} onOpenChange={(s) => { form.reset(); onOpenChange(s) }}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the user details.' : 'Create a new user account.'}{' '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[32rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form id='user-form' onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className='space-y-4 px-0.5'>
              {/* First + Last name */}
              <div className='grid grid-cols-2 gap-3'>
                <FormField control={form.control} name='firstName' render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder='John' {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name='lastName' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder='Doe' {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name='email' render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder='john@company.com' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Gender + Title */}
              <div className='grid grid-cols-2 gap-3'>
                <FormField control={form.control} name='gender' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select...'
                      items={[
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Prefer not to say', value: 'prefer_not_to_say' },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name='title' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl><Input placeholder='e.g. HR Manager' {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name='role' render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select a role'
                    items={roles.map(({ label, value }) => ({ label, value }))}
                  />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name='password' render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEdit ? 'New Password (optional)' : 'Password'}</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='••••••••' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name='confirmPassword' render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput disabled={!isPasswordTouched} placeholder='••••••••' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={mutation.isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
