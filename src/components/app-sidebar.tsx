import { MANAGER_USER_IDS } from '@/conf';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Building2,
  Briefcase,
  Users,
  Ticket,
  IndianRupee,
  FolderOpenDot,
  Database,
  FolderDown,
  Logs,
  Megaphone,
  LifeBuoy,
  GalleryVerticalEnd,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import SailLogo from '@/assets/sail-logo-3-cropped.svg';

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
      title: 'Accounts',
      url: '#',
      icon: Building2,
      items: [
        {
          title: 'Accounts Database',
          url: '/accounts',
        },
        {
          title: 'Account Tasks',
          url: '/account-tasks',
        },
        {
          title: 'Call Recordings',
          url: '/call-recordings',
        },
        // {
        //   title: 'Acccounts Status Journey',
        //   url: '/acc-status-journey',
        // },
      ],
    },
    {
      title: 'Deals',
      url: '#',
      icon: Briefcase,
      items: [
        {
          title: 'Deals Database',
          url: '/deals',
        },
        {
          title: 'Deals Kanban',
          url: '/kanban-deals',
        },
        {
          title: 'Deal Tasks',
          url: '/deal-tasks',
        },
      ],
    },
    {
      title: 'Contacts',
      url: '#',
      icon: Users,
      items: [
        {
          title: 'All Contacts',
          url: '/contacts',
        },
      ],
    },
    {
      title: 'Tickets',
      url: '#',
      icon: Ticket,
      items: [
        {
          title: 'Tickets Database',
          url: '/tickets',
        },
        {
          title: 'Tickets Kanban',
          url: '/kanban-tickets',
        },
      ],
    },
    {
      title: 'Revenue',
      url: '#',
      icon: IndianRupee,
      items: [
        {
          title: 'Revenue Entries',
          url: '/revenue',
        },
      ],
    },
    {
      title: 'Workspace',
      url: '#',
      icon: FolderOpenDot,
      items: [
        {
          title: 'Projects',
          url: '/projects',
        },
        {
          title: 'Hiring',
          url: '/hiring',
        },
      ],
    },
    {
      title: 'Data Repository',
      url: '#',
      icon: Database,
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
      title: 'Tools & Logs',
      url: '#',
      icon: FolderDown,
      items: [
        {
          title: 'Exports',
          url: '/exports',
        },
        {
          title: 'Audit Log',
          url: '/audit-logs',
        },
        {
          title: 'Project Logs',
          url: '/project-logs',
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const currentUserId = user?.user_id ? String(user.user_id) : '';
  const rawRole = String(user?.role || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
  const isSuperAdmin =
    ['super_admin', 'superadmin'].includes(rawRole) ||
    rawRole.includes('super_admin') ||
    rawRole.includes('superadmin');
  const isAdminOrSuperAdmin =
    isSuperAdmin || ['admin'].includes(rawRole) || rawRole.includes('admin');

  // Isolate user identity signatures
  const isSarada = currentUserId === '3899927000000221552';
  const isAmbika = currentUserId === '3899927000000527649';
  const isManager = MANAGER_USER_IDS.includes(currentUserId);

  const navUser = {
    name: user?.user_name || 'User',
    email: user?.email || '',
    avatar: '/avatars/shadcn.jpg',
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='border-b border-border/50'>
        <div className='flex items-center justify-between h-14 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center'>
          <div className='flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full'>
            {/* Collapsed Icon - Shown only when sidebar is collapsed */}
            <div className='hidden group-data-[collapsible=icon]:flex h-8 w-8 min-w-8 min-h-8 aspect-square shrink-0 items-center justify-center shadow-md shadow-blue-500/25'>
              <img
                src={SailLogo}
                alt='R1X SAIL'
                className='h-5 dark:brightness-125'
              />
            </div>

            {/* Brand Logo - Shown only when expanded */}
            <div className='flex flex-col group-data-[collapsible=icon]:hidden min-w-0'>
              <img
                src={SailLogo}
                alt='R1X SAIL'
                className='h-14 ml-7 dark:brightness-125'
              />
            </div>
          </div>
          <SidebarTrigger className='group-data-[collapsible=icon]:hidden text-muted-foreground hover:text-foreground gap-2' />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain
            .filter((item) => {
              if (isSarada || isAmbika) {
                return item.title === 'Workspace';
              }

              if (item.title === 'Tools & Logs' && !isSuperAdmin) {
                return false;
              }

              return true;
            })
            .map((item) => {
              let items = item.items;
              if (isSarada || isAmbika) {
                items = items?.filter((subItem) => subItem.url === '/hiring');
              } else {
                items = items?.filter((subItem) => {
                  if (
                    subItem.url === '/acc-status-journey' &&
                    !isAdminOrSuperAdmin
                  ) {
                    return false;
                  }
                  return true;
                });
              }
              return {
                ...item,
                items,
              };
            })}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
