'use client'

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
  GalleryVerticalEnd,
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
        {
          title: 'Leads',
          url: '/leads',
        },
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
      ],
    },
    {
      title: 'Tickets',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Desk',
          url: '/desk',
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
