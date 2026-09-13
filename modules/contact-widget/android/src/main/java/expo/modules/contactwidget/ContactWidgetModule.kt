package expo.modules.contactwidget

import android.appwidget.AppWidgetManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The app's half of the home-screen widget: it hands over what the widget may show, and asks the
 * launcher to pin one. Everything the widget draws is drawn natively — see [ContactWidgetProvider].
 */
class ContactWidgetModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  override fun definition() = ModuleDefinition {
    Name("ContactWidget")

    /**
     * Pinning from inside an app needs Android 8, and launchers may still refuse it. Both are
     * reasons to hide the button rather than to offer one that does nothing.
     */
    Function("isPinSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        AppWidgetManager.getInstance(context).isRequestPinAppWidgetSupported
    }

    /** The whole book as `[{ id, name, address }]` — the only contact data the widget ever sees. */
    Function("syncContacts") { contactsJson: String ->
      WidgetStore(context).saveContacts(contactsJson)
      ContactWidgetProvider.renderAll(context)
    }

    /**
     * Point a widget at one of the saved contacts. This is the other half of the empty state: a
     * widget dragged off the launcher's picker arrives with no contact, taps through to the app,
     * and is bound here.
     *
     * `false` means the widget is no longer on the home screen — removed while the picker was open.
     */
    AsyncFunction("bindWidget") { appWidgetId: Int, contactId: String ->
      val store = WidgetStore(context)
      store.bind(appWidgetId, contactId)

      val drawn = ContactWidgetProvider.renderOne(context, appWidgetId)
      if (!drawn) store.unbind(appWidgetId)
      drawn
    }

    /** `size` is one of the keys in [providerFor] — the shape the user picked in the app. */
    AsyncFunction("requestPin") { contactId: String, size: String ->
      val manager = AppWidgetManager.getInstance(context)
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || !manager.isRequestPinAppWidgetSupported) {
        return@AsyncFunction false
      }

      val provider = providerFor(size)
      // Mutable on purpose: the system writes the new widget's id into this intent before firing
      // it back, and that id is the only way to know which widget the user just accepted.
      val callback = Intent(context, provider)
        .setAction(ContactWidgetProvider.ACTION_PINNED)
        .putExtra(ContactWidgetProvider.EXTRA_CONTACT_ID, contactId)
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      // One pending intent per contact *and* size: the same contact may be pinned at every size,
      // and a shared request code would hand the second pin the first one's callback.
      val pending = PendingIntent.getBroadcast(context, "$contactId/$size".hashCode(), callback, flags)

      manager.requestPinAppWidget(ComponentName(context, provider), null, pending)
    }
  }

  /** Unknown sizes fall back to the square: a widget of the wrong shape beats no widget at all. */
  private fun providerFor(size: String): Class<out ContactWidgetProvider> = when (size) {
    "row" -> ContactWidgetRowProvider::class.java
    "wide" -> ContactWidgetWideProvider::class.java
    else -> ContactWidgetProvider::class.java
  }
}
