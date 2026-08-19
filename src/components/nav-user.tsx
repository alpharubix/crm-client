import {
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
  Laptop,
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
  const { logout, user: authUser } = useAuth()
  const { theme, setTheme } = useTheme()

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const rawRole = authUser?.role || ''
  const formattedRole =
    rawRole
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || 'User'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent/80 data-[state=open]:text-sidebar-accent-foreground group hover:bg-sidebar-accent/50 transition-all duration-200 rounded-xl p-2 cursor-pointer border border-transparent hover:border-border/40'
            >
              <div className='relative shrink-0'>
                <Avatar className='h-9 w-9 rounded-xl ring-2 ring-blue-500/30 ring-offset-2 ring-offset-sidebar shadow-xs transition-transform duration-200 group-hover:scale-105'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs shadow-inner'>
                    {initials || <CircleUserRound className='h-4 w-4' />}
                  </AvatarFallback>
                </Avatar>
                {/* Active online status indicator */}
                <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-sidebar shadow-2xs' />
              </div>

              <div className='grid flex-1 text-left text-sm leading-tight pl-0.5 min-w-0'>
                <div className='flex items-center gap-1.5 min-w-0'>
                  <span className='truncate font-semibold text-foreground text-xs tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                    {user.name}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-1 mt-0.5'>
                  <span className='truncate text-[10px] text-muted-foreground font-medium'>
                    {formattedRole}
                  </span>
                </div>
              </div>

              <div className='h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors ml-auto shrink-0'>
                <ChevronsUpDown className='size-3.5' />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className='w-72 rounded-2xl shadow-2xl border-border/80 bg-background/95 backdrop-blur-md p-0 overflow-hidden'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={10}
          >
            {/* Header Profile Section */}
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='relative bg-gradient-to-br from-blue-600/10 via-indigo-500/5 to-transparent p-4 border-b border-border/60'>
                <div className='flex items-start gap-3.5'>
                  <div className='relative shrink-0'>
                    <Avatar className='h-12 w-12 rounded-2xl ring-2 ring-blue-500/40 shadow-md'>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className='rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm shadow-inner'>
                        {initials || <CircleUserRound className='h-5 w-5' />}
                      </AvatarFallback>
                    </Avatar>
                    <span className='absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs' />
                  </div>

                  <div className='flex flex-col min-w-0 flex-1 pt-0.5'>
                    <div className='flex items-center gap-1.5'>
                      <span className='font-bold text-sm text-foreground truncate tracking-tight'>
                        {user.name}
                      </span>
                      <Sparkles className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                    </div>
                    <span className='text-xs text-muted-foreground truncate font-medium mt-0.5'>
                      {user.email}
                    </span>

                    <div className='mt-2.5 flex items-center gap-2'>
                      <span className='inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-2.5 py-0.5 rounded-full shadow-2xs'>
                        <ShieldCheck className='h-3 w-3' />
                        {formattedRole}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* Theme / Appearance Segment Switcher */}
            <div className='px-3.5 py-3 border-b border-border/50 bg-muted/20'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-[10px] uppercase tracking-wider text-muted-foreground font-bold'>
                  Appearance Mode
                </span>
                <span className='text-[10px] text-blue-600 dark:text-blue-400 font-semibold capitalize'>
                  {theme || 'system'}
                </span>
              </div>
              <div className='grid grid-cols-3 rounded-xl bg-muted/60 p-1 gap-1 border border-border/40 shadow-inner'>
                <button
                  type='button'
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer',
                    theme === 'light'
                      ? 'bg-background text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  )}
                >
                  <Sun className='h-3.5 w-3.5' />
                  Light
                </button>
                <button
                  type='button'
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer',
                    theme === 'dark'
                      ? 'bg-background text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  )}
                >
                  <Moon className='h-3.5 w-3.5' />
                  Dark
                </button>
                <button
                  type='button'
                  onClick={() => setTheme('system')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer',
                    theme === 'system'
                      ? 'bg-background text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  )}
                >
                  <Laptop className='h-3.5 w-3.5' />
                  System
                </button>
              </div>
            </div>

            <DropdownMenuSeparator className='m-0' />

            {/* Logout Action */}
            <DropdownMenuGroup className='p-1.5'>
              <DropdownMenuItem
                onClick={logout}
                className='cursor-pointer gap-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-500/10 dark:focus:bg-rose-500/15 rounded-xl p-2.5 transition-colors'
              >
                <div className='h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0'>
                  <LogOut className='h-4 w-4' />
                </div>
                Log out of account
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
