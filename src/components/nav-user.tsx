import {
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/auth-context'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group'
            >
              <Avatar className='h-8 w-8 rounded-lg ring-2 ring-primary/30 ring-offset-1 ring-offset-sidebar'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='rounded-lg bg-primary text-primary-foreground text-xs font-semibold'>
                  {initials || <CircleUserRound className='h-4 w-4' />}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold text-foreground'>{user.name}</span>
                <span className='truncate text-xs text-muted-foreground'>{user.email}</span>
              </div>
              <ChevronsUpDown className='ml-auto size-4 text-muted-foreground' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl shadow-xl border-border/60'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={6}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-3 px-2 py-2.5 text-left text-sm bg-muted/30 rounded-t-xl border-b border-border/50'>
                <Avatar className='h-9 w-9 rounded-lg ring-2 ring-primary/20'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-lg bg-primary text-primary-foreground text-xs font-semibold'>
                    {initials || <CircleUserRound className='h-4 w-4' />}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold text-foreground'>{user.name}</span>
                  <span className='truncate text-xs text-muted-foreground'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* Theme Toggle Row */}
            <div className='px-2 py-2 border-b border-border/50'>
              <p className='text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1'>Appearance</p>
              <div className='flex rounded-lg bg-muted/60 p-0.5 gap-0.5'>
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-md font-medium transition-all',
                    !isDark
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sun className='h-3.5 w-3.5' />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-md font-medium transition-all',
                    isDark
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Moon className='h-3.5 w-3.5' />
                  Dark
                </button>
              </div>
            </div>

            <DropdownMenuGroup className='p-1'>
              <DropdownMenuItem
                onClick={logout}
                className='cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg'
              >
                <LogOut className='h-4 w-4' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
