package expo.modules.contactwidget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Name, address, and the id the widget deep-links back into. Nothing else leaves the app. */
data class WidgetContact(val id: String, val name: String, val address: String)

/**
 * What the widget knows, kept where a widget can read it.
 *
 * A RemoteViews widget runs without the React Native runtime — after a reboot, or with the app
 * force-stopped, there is no JavaScript to ask. So the app pushes a snapshot of id, name and
 * address here on every change, and the provider reads it synchronously while drawing.
 *
 * Public addresses only, in the app's own private preferences. Nothing secret is ever stored: see
 * docs/07-SECURITY-PRIVACY.md.
 */
class WidgetStore(context: Context) {
  private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun saveContacts(json: String) {
    prefs.edit().putString(KEY_CONTACTS, json).apply()
  }

  fun bind(appWidgetId: Int, contactId: String) {
    prefs.edit().putString(widgetKey(appWidgetId), contactId).apply()
  }

  fun unbind(appWidgetId: Int) {
    prefs.edit().remove(widgetKey(appWidgetId)).apply()
  }

  fun contactIdFor(appWidgetId: Int): String? = prefs.getString(widgetKey(appWidgetId), null)

  /** `null` when the contact has been deleted since the widget was pinned — a state worth showing. */
  fun contactFor(appWidgetId: Int): WidgetContact? {
    val contactId = contactIdFor(appWidgetId) ?: return null
    val raw = prefs.getString(KEY_CONTACTS, null) ?: return null

    return try {
      val contacts = JSONArray(raw)
      (0 until contacts.length())
        .map { contacts.getJSONObject(it) }
        .firstOrNull { it.optString("id") == contactId }
        ?.toWidgetContact()
    } catch (error: Exception) {
      // Corrupt input is treated as no input: a widget that says "unavailable" beats one that
      // crashes the launcher's host process.
      null
    }
  }

  private fun JSONObject.toWidgetContact(): WidgetContact? {
    val id = optString("id")
    val name = optString("name")
    val address = optString("address")
    if (id.isEmpty() || address.isEmpty()) return null
    return WidgetContact(id, name, address)
  }

  private fun widgetKey(appWidgetId: Int) = "widget.$appWidgetId"

  companion object {
    private const val PREFS = "com.solcontacts.app.widget"
    private const val KEY_CONTACTS = "contacts"
  }
}
