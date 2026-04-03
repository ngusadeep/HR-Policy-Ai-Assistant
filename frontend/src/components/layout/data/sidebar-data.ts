import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  HelpCircle,
  UserCog,
  Wrench,
  Palette,
  Bell,
  Monitor,
  Building2,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'HR Admin',
    email: 'admin@organisation.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'My Organisation',
      logo: Building2,
      plan: 'HR Policy Assistant',
    },
  ],
  navGroups: [
    {
      title: 'Menu',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Policy Documents',
          url: '/dashboard/documents',
          icon: FileText,
        },
        {
          title: 'Users',
          url: '/dashboard/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/dashboard/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/dashboard/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/dashboard/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/dashboard/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/dashboard/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/dashboard/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
