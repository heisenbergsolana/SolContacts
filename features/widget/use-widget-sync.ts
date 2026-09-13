import { useEffect } from 'react'
import { Contact } from '@/types/contact'
import { syncWidgetContacts } from '@/modules/contact-widget'

/**
 * Keep the home-screen widget's copy of the book in step with the app's.
 *
 * The widget is RemoteViews: it redraws after a reboot, with the app closed, and there is no
 * JavaScript around to ask at that point. So every change is pushed to native storage as it lands,
 * and only the three fields a widget draws — id, name, address — are pushed at all.
 */
export function useWidgetSync(contacts: Contact[], ready: boolean): void {
  useEffect(() => {
    if (!ready) return
    syncWidgetContacts(contacts.map(({ id, name, address }) => ({ id, name, address })))
  }, [contacts, ready])
}
