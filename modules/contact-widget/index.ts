// From `expo-modules-core` rather than the `expo` root: the root package pulls in the asset
// registry side effects, which a unit test has no runtime for.
import { requireOptionalNativeModule } from 'expo-modules-core'

/** The only contact data that ever reaches the widget. Never a note, never anything but a public address. */
export interface WidgetContact {
  id: string
  name: string
  address: string
}

/**
 * The shapes a contact can be pinned as. The launcher offers these as three separate widgets — it
 * has no notion of one widget in several sizes — so the app asks for the one the user picked.
 */
export type WidgetSize = 'square' | 'row' | 'wide'

interface ContactWidgetNativeModule {
  isPinSupported(): boolean
  syncContacts(contactsJson: string): void
  requestPin(contactId: string, size: WidgetSize): Promise<boolean>
  bindWidget(appWidgetId: number, contactId: string): Promise<boolean>
}

/**
 * Optional on purpose: the widget is Android-only native code, so it is absent under vitest and in
 * any build that predates it. Every caller below degrades to "no widget" rather than throwing.
 */
const native = requireOptionalNativeModule<ContactWidgetNativeModule>('ContactWidget')

/** Whether this launcher will let the app pin a widget — Android 8 and a launcher that allows it. */
export function isWidgetPinSupported(): boolean {
  return native?.isPinSupported() ?? false
}

/** Hand the widget its snapshot. Call it whenever the contact book changes. */
export function syncWidgetContacts(contacts: readonly WidgetContact[]): void {
  native?.syncContacts(JSON.stringify(contacts))
}

/**
 * Ask the launcher to pin a widget for this contact.
 *
 * Resolves `true` once the request was accepted by the launcher, which is not the same as the user
 * accepting the dialog — Android gives no callback for a refusal.
 */
export async function requestWidgetPin(contactId: string, size: WidgetSize): Promise<boolean> {
  return (await native?.requestPin(contactId, size)) ?? false
}

/**
 * Point a widget already on the home screen at a contact.
 *
 * The launcher's own picker drops a widget with nothing in it; that widget taps through to the app
 * carrying its id, and this is what the choice made there comes back to. Resolves `false` when the
 * widget is gone — removed from the home screen while the app was open.
 */
export async function bindWidgetContact(appWidgetId: number, contactId: string): Promise<boolean> {
  return (await native?.bindWidget(appWidgetId, contactId)) ?? false
}
