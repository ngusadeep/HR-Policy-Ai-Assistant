import * as React from 'react'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'

type OrgDisplayProps = {
  name: string
  logo: React.ElementType
  plan: string
}

export function TeamSwitcher({ teams }: { teams: OrgDisplayProps[] }) {
  const org = teams[0]
  if (!org) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className='flex items-center gap-2 px-2 py-1.5'>
          <div className='flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <org.logo className='size-4' />
          </div>
          <div className='grid flex-1 text-start text-sm leading-tight'>
            <span className='truncate font-semibold'>{org.name}</span>
            <span className='truncate text-xs text-muted-foreground'>{org.plan}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
