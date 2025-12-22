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
    subItems?.some((sub) => pathname === sub.url)

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const parentActive = isParentActive(item.items)

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={parentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={parentActive ? 'bg-muted text-primary' : ''}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const subActive = pathname === subItem.url

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={
                              subActive
                                ? 'bg-muted text-primary ring-2 ring-blue-800'
                                : ''
                            }
                          >
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
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
