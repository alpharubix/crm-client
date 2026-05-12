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
        // {
        //   title: 'Leads',
        //   url: '/leads',
        // },
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
          title: 'Tickets Kanban',
          url: '/kanban-tickets',
        },
        {
          title: 'Revenue',
          url: '/revenue',
        },
        // {
        //   title: 'Deals',
        //   url: '/deals',
        // },
        // {
        //   title: 'Tasks',
        //   url: '#',
        // }, {
        //   title: 'Attachments',
        //   url: '#',
        // }
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
        // {
        //   title: 'All Tasks',
        //   url: '/tasks',
        // },
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
        {
          title: 'Candidate',
          url: '/candidate',
        },
        // {
        //   title: 'All Tasks',
        //   url: '/tasks',
        // },
      ],
    },
  ],
}

import { useAuth } from '@/context/auth-context'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

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
            if (item.title === 'Logs' && user?.role !== 'super_admin') {
              return false
            }
            if (
              item.title === 'Export' &&
              user?.role !== 'super_admin' &&
              user?.role !== 'admin'
            ) {
              return false
            }
            if (
              item.title === 'Hiring' &&
              user?.role !== 'super_admin' &&
              user?.role !== 'admin'
            ) {
              return false
            }
            return true
          })}
        />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
