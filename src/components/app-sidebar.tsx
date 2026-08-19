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
      title: 'Accounts & Tasks',
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
      ],
    },
    {
      title: 'Deals & Pipeline',
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
  const isAdminOrSuperAdmin =
    ['super_admin', 'superadmin', 'admin'].includes(rawRole) ||
    rawRole.includes('admin');

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
          <div className='flex items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full'>
            {/* Logo Icon - Fixed sizing to prevent squeezing */}
            <div className='flex h-8 w-8 min-w-8 min-h-8 aspect-square shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25'>
              <svg
                className='h-4.5 w-4.5 shrink-0'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
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
              <span className='text-[10px] text-muted-foreground/70 leading-none mt-0.5 tracking-wide'>
                AlphaRubix
              </span>
            </div>
          </div>
          <SidebarTrigger className='group-data-[collapsible=icon]:hidden text-muted-foreground hover:text-foreground' />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain
            .filter((item) => {
              if (isSarada || isAmbika) {
                return item.title === 'Workspace';
              }

              if (item.title === 'Tools & Logs' && !isAdminOrSuperAdmin) {
                return false;
              }

              return true;
            })
            .map((item) => {
              if (isSarada || isAmbika) {
                return {
                  ...item,
                  items: item.items?.filter(
                    (subItem) => subItem.url === '/hiring',
                  ),
                };
              }
              return item;
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
