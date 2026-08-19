import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { pathname } = useLocation()

  const isParentActive = (subItems?: { url: string }[]) =>
    subItems?.some((sub) => pathname === sub.url || pathname.startsWith(sub.url + '/'))

  return (
    <SidebarGroup className='px-2 py-1'>
      <SidebarMenu className='gap-0.5'>
        {items.map((item) => {
          const parentActive = isParentActive(item.items)

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={parentActive}
              className='group/collapsible'
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn(
                      'h-9 rounded-lg text-sm font-medium transition-all duration-150',
                      parentActive
                        ? 'text-foreground bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    )}
                  >
                    {item.icon && <item.icon className='h-4 w-4 shrink-0' />}
                    <span className='truncate'>{item.title}</span>
                    <ChevronRight className='ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/60' />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent className='overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'>
                  <SidebarMenuSub className='ml-3.5 mt-0.5 mb-0.5 pl-3 border-l border-border/50 gap-0'>
                    {item.items?.map((subItem) => {
                      const subActive = pathname === subItem.url || pathname.startsWith(subItem.url + '/')

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              'h-8 rounded-md text-sm transition-all duration-150 my-0.5',
                              subActive
                                ? 'bg-primary/10 text-primary font-medium dark:bg-primary/15 dark:text-blue-400'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                            )}
                          >
                            <Link to={subItem.url}>
                              {subActive && (
                                <span className='absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full' />
                              )}
                              <span className='truncate'>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
