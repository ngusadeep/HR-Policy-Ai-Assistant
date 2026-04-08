import { useEffect, useState, useRef } from 'react'
import { Plus, Pencil, ShieldCheck, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchRoles, createRole, updateRole } from './api/roles-api'
import type { Role } from './data/schema'

// ─── Role dialog (create / edit) ─────────────────────────────────────────────

interface RoleDialogProps {
  open: boolean
  role?: Role
  allPermissions: string[]
  onClose: () => void
  onSaved: (role: Role) => void
}

function RoleDialog({ open, role, allPermissions, onClose, onSaved }: RoleDialogProps) {
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [permInput, setPermInput] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '')
      setPermissions(role?.permissions.map((p) => p.name) ?? [])
      setPermInput('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, role])

  const addPermission = (perm: string) => {
    const trimmed = perm.trim()
    if (!trimmed || permissions.includes(trimmed)) return
    setPermissions((prev) => [...prev, trimmed])
    setPermInput('')
  }

  const removePermission = (perm: string) => {
    setPermissions((prev) => prev.filter((p) => p !== perm))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const saved = role
        ? await updateRole(role.id, { name: name.trim(), permissions })
        : await createRole(name.trim())
      onSaved(saved)
      onClose()
      toast.success(role ? 'Role updated' : 'Role created', { description: saved.name })
    } catch {
      toast.error('Error', { description: 'Could not save role.' })
    } finally {
      setSaving(false)
    }
  }

  // Suggestions: permissions not yet added, derived from all known permissions
  const suggestions = allPermissions.filter(
    (p) => !permissions.includes(p) && p.toLowerCase().includes(permInput.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {role ? 'Rename the role or adjust its permissions.' : 'Add a new role and assign permissions to it.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='role-name'>Role name</Label>
            <Input
              id='role-name'
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Manager'
              onKeyDown={(e) => e.key === 'Enter' && !permInput && handleSave()}
            />
          </div>

          <div className='space-y-1.5'>
            <Label>Permissions</Label>
            {permissions.length > 0 && (
              <div className='flex flex-wrap gap-1.5'>
                {permissions.map((p) => (
                  <Badge key={p} variant='secondary' className='gap-1 pr-1'>
                    {p}
                    <button
                      type='button'
                      onClick={() => removePermission(p)}
                      className='ml-0.5 rounded hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className='relative'>
              <Input
                value={permInput}
                onChange={(e) => setPermInput(e.target.value)}
                placeholder='Type a permission and press Enter…'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addPermission(permInput)
                  }
                }}
              />
              {permInput && suggestions.length > 0 && (
                <div className='absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md'>
                  {suggestions.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      type='button'
                      className='flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent'
                      onMouseDown={(e) => {
                        e.preventDefault()
                        addPermission(s)
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {role ? 'Save changes' : 'Create role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Roles page ──────────────────────────────────────────────────────────

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | undefined>()

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .finally(() => setLoading(false))
  }, [])

  // Collect all distinct permission names across all roles for autocomplete
  const allPermissions = Array.from(
    new Set(roles.flatMap((r) => r.permissions.map((p) => p.name)))
  )

  const openCreate = () => {
    setEditingRole(undefined)
    setDialogOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditingRole(role)
    setDialogOpen(true)
  }

  const handleSaved = (saved: Role) => {
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Roles & Permissions</h1>
            <p className='text-sm text-muted-foreground'>
              Manage roles and the permissions assigned to each.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className='mr-2 h-4 w-4' />
            New Role
          </Button>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-24'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : roles.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center'>
            <ShieldCheck className='mb-3 h-10 w-10 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>No roles yet. Create one to get started.</p>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-base'>{role.name}</CardTitle>
                    <div className='flex h-8 w-8 items-center justify-center rounded-md bg-muted'>
                      <ShieldCheck className='h-4 w-4 text-muted-foreground' />
                    </div>
                  </div>
                  <CardDescription>
                    {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {role.permissions.length === 0 ? (
                    <p className='text-xs text-muted-foreground'>No permissions assigned.</p>
                  ) : (
                    <div className='flex flex-wrap gap-1.5'>
                      {role.permissions.map((p) => (
                        <Badge key={p.id} variant='secondary' className='text-xs'>
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className='border-t pt-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => openEdit(role)}
                  >
                    <Pencil className='mr-2 h-3.5 w-3.5' />
                    Edit Role
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </Main>

      <RoleDialog
        open={dialogOpen}
        role={editingRole}
        allPermissions={allPermissions}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />
    </>
  )
}
