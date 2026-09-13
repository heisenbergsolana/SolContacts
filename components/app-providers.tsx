import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { ContactsProvider } from '@/features/contacts/use-contacts'

const queryClient = new QueryClient()

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ContactsProvider>{children}</ContactsProvider>
    </QueryClientProvider>
  )
}
