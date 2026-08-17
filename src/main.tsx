import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/sonner.tsx'

import { ThemeProvider } from './components/theme-provider.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      retry: 1, // avoid infinite retries
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
      <App />
      <Toaster richColors position='top-right' />
    </ThemeProvider>
  </QueryClientProvider>
)
