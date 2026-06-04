import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ENV, HR_USER_IDS, MANAGER_USER_IDS } from '@/conf'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  BookOpen,
  FolderDown,
  FolderOpenDot,
  GalleryVerticalEnd,
  Logs,
  Megaphone,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const data = {
  user: {
    name: 'AlphaRubix infotech',
    email: 'alpharubixinfotech@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'AlphaRubix infotech',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
  ],
  navMain: [
    {
      title: 'Modules',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Accounts',
          url: '/accounts',
        },
        {
          title: 'Contacts',
          url: '/contacts',
        },
        {
          title: 'Deals',
          url: '/deals',
        },
        {
          title: 'Deals Kanban',
          url: '/kanban-deals',
        },
        {
          title: 'Tickets',
          url: '/tickets',
        },
        {
          title: 'Tickets Kanban',
          url: '/kanban-tickets',
        },
        {
          title: 'Revenue',
          url: '/revenue',
        },
      ],
    },
    {
      title: 'Export',
      url: '#',
      icon: FolderDown,
      items: [
        {
          title: 'All Exports',
          url: '/exports',
        },
      ],
    },
    {
      title: 'Logs',
      url: '#',
      icon: Logs,
      items: [
        {
          title: 'Audit Log',
          url: '/audit-logs',
        },
      ],
    },
    {
      title: 'Projects',
      url: '#',
      icon: FolderOpenDot,
      items: [
        {
          title: 'All Projects',
          url: '/projects',
        },
      ],
    },
    {
      title: 'Hiring',
      url: '#',
      icon: Megaphone,
      items: [
        {
          title: 'Job Requirement',
          url: '/hiring',
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const currentUserId = user?.user_id ? String(user.user_id) : ''
  const currentUserRole = user?.role || ''

  // Isolate user identity signatures
  const isSarada = currentUserId === '3899927000000221552'
  const isManager = MANAGER_USER_IDS.includes(currentUserId)

  const navUser = {
    name: user?.user_name || 'User',
    email: user?.email || '',
    avatar: '/avatars/shadcn.jpg',
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain.filter((item) => {
            // ── 1. ABSOLUTE STRIP DOWN FOR SARADA ──
            // Sarada can ONLY see Hiring. No other tabs (Modules, Projects, etc.) are allowed.
            if (isSarada) {
              return item.title === 'Hiring'
            }

            // ── 2. LOGS PERMISSION GATEWAY ──
            if (item.title === 'Logs' && currentUserRole !== 'super_admin') {
              return false
            }

            // ── 3. EXPORTS PERMISSION GATEWAY ──
            if (
              item.title === 'Export' &&
              currentUserRole !== 'super_admin' &&
              currentUserRole !== 'admin'
            ) {
              return false
            }

            // ── 4. HIRING PERMISSION GATEWAY FOR SYSTEM ACTORS ──
            // Display Hiring module for Super Admin, Admin, and ALL Managers
            if (item.title === 'Hiring') {
              const hasGlobalRole =
                currentUserRole === 'super_admin' || currentUserRole === 'admin'
              if (!hasGlobalRole && !isManager) {
                return false
              }
            }

            return true
          })}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
