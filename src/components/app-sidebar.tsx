import { MANAGER_USER_IDS } from '@/conf'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  BookOpen,
  FolderDown,
  FolderOpenDot,
  Logs,
  Megaphone,
  LifeBuoy,
  GalleryVerticalEnd,
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
          title: 'Account Tasks',
          url: '/account-tasks',
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
        {
          title: 'Project logs',
          url: '/project-logs',
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
    {
      title: 'Data Repository',
      url: '#',
      icon: FolderDown,
      items: [
        {
          title: 'Invoicing Master',
          url: '/invoicing-master',
        },
        {
          title: 'Distributor Master',
          url: '/distributer-master',
        },
        {
          title: 'Limit Reports',
          url: '/limit-reports',
        },
      ],
    },
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
      items: [
        {
          title: 'Software Support',
          url: '/support-tickets',
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
  const isAmbika = currentUserId === '3899927000000527649'
  const isManager = MANAGER_USER_IDS.includes(currentUserId)

  const navUser = {
    name: user?.user_name || 'User',
    email: user?.email || '',
    avatar: '/avatars/shadcn.jpg',
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='border-b border-border/50'>
        <div className='flex items-center justify-between h-14 px-3'>
          <div className='flex items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full'>
            {/* Logo Icon */}
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25'>
              <svg className='h-4.5 w-4.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                <circle cx='9' cy='7' r='4' />
                <polyline points='16 11 18 13 22 9' />
              </svg>
            </div>
            {/* Brand Name */}
            <div className='flex flex-col group-data-[collapsible=icon]:hidden min-w-0'>
              <span className='text-base font-bold tracking-tight text-foreground leading-none'>
                R1X <span className='text-blue-500'>CRM</span>
              </span>
              <span className='text-[10px] text-muted-foreground/70 leading-none mt-0.5 tracking-wide'>AlphaRubix</span>
            </div>
          </div>
          <SidebarTrigger className='group-data-[collapsible=icon]:hidden text-muted-foreground hover:text-foreground' />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain.filter((item) => {
            // ── 1. ABSOLUTE STRIP DOWN FOR SARADA & AMBIKA ──
            // Sarada & Ambika can ONLY see Hiring. No other tabs (Modules, Projects, etc.) are allowed.
            if (isSarada || isAmbika) {
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
