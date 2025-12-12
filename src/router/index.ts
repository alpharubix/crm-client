import AccountPage from '@/components/accounts'
import Home from '@/components/home'
import LeadsPage from '@/components/leads'
import Root from '@/components/root'
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      {
        path: 'leads',
        Component: LeadsPage,
        // children: [
        //   { path: 'login', Component: Login },
        //   { path: 'register', Component: Register },
        // ],
      },
      {
        path: 'accounts',
        Component: AccountPage,
        // children: [
        //   { index: true, Component: ConcertsHome },
        //   { path: ':city', Component: ConcertsCity },
        //   { path: 'trending', Component: ConcertsTrending },
        // ],
      },
    ],
  },
  {
    path: '*',
    Component: () => {
      return '<>NOT FOUND</>'
    },
  },
])
