import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Outlet } from 'react-router-dom'

export default function SidebarComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='overflow-hidden'>
        <div className='flex flex-1 flex-col min-h-screen'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
