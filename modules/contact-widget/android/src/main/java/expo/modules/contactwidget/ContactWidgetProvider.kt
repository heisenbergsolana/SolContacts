package expo.modules.contactwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ClipData
import android.content.ClipboardManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import android.widget.Toast

/**
 * The home-screen widget: one contact, its code, and a button that takes the address.
 *
 * Everything it draws comes from [WidgetStore], never from the running app — a widget is expected
 * to be correct on a rebooted phone whose app has not been opened yet.
 *
 * This class is the 2x2 provider and the base of the other sizes ([ContactWidgetRowProvider],
 * [ContactWidgetWideProvider]): a launcher's picker lists providers rather than sizes, so each
 * size the user can pick has to be its own receiver. Only the cells they ask for differ — the
 * drawing below is shared, and adapts to whatever size the widget ends up at.
 */
open class ContactWidgetProvider : AppWidgetProvider() {
  /** What to draw before the launcher has reported a size — the shape this provider asked for. */
  protected open val defaultLayout: Layout = Layout.COMPACT

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { render(context, appWidgetManager, it) }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    // Resizing changes which layout fits and how large the code should be drawn.
    render(context, appWidgetManager, appWidgetId)
  }

  override fun onDeleted(context: Context, appWidgetIds: IntArray) {
    val store = WidgetStore(context)
    appWidgetIds.forEach { store.unbind(it) }
  }

  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_PINNED -> {
        // The launcher, not the app, decides the widget id — it arrives only once the user has
        // accepted the pin, which is why the contact is bound here rather than at request time.
        val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        val contactId = intent.getStringExtra(EXTRA_CONTACT_ID)
        if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID && !contactId.isNullOrEmpty()) {
          WidgetStore(context).bind(appWidgetId, contactId)
          render(context, AppWidgetManager.getInstance(context), appWidgetId)
        }
      }

      ACTION_COPY -> {
        val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        WidgetStore(context).contactFor(appWidgetId)?.let { copyAddress(context, it.address) }
      }
    }

    super.onReceive(context, intent)
  }

  private fun copyAddress(context: Context, address: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return
    clipboard.setPrimaryClip(ClipData.newPlainText(context.getString(R.string.widget_clip_label), address))

    // Android 13 and later show their own copy confirmation; a toast on top of it would say the
    // same thing twice.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      Toast.makeText(context, R.string.widget_copied, Toast.LENGTH_SHORT).show()
    }
  }

  private fun render(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
    val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
    // The portrait pair: OPTION_APPWIDGET_MIN_WIDTH is the width a portrait home screen gives, and
    // MAX_HEIGHT the height it gives there — MIN_HEIGHT is the landscape one. Measuring against the
    // landscape height is what used to leave a third of the widget empty on the screen people
    // actually look at.
    val widthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
    val heightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0)

    // All three layouts carry the same view ids, so everything below is written once.
    val layout = layoutFor(widthDp, heightDp)
    val sizing = sizingFor(layout, widthDp, heightDp)
    val views = RemoteViews(context.packageName, layout.resource)
    val contact = WidgetStore(context).contactFor(appWidgetId)

    if (contact == null) {
      // Two ways to land here, and they are not the same news. A widget dragged off the launcher's
      // own picker has never been given a contact; a pinned one whose contact was deleted has lost
      // the one it had. Both end at the same screen, because that is where the choice is made — and
      // neither shows a stale address someone might still send to.
      val lost = WidgetStore(context).contactIdFor(appWidgetId) != null
      val choose = chooseIntent(context, appWidgetId)

      views.setViewVisibility(R.id.widget_details, View.VISIBLE)
      views.setViewVisibility(R.id.widget_qr, View.GONE)
      views.setViewVisibility(R.id.widget_copy, View.VISIBLE)
      views.setImageViewResource(R.id.widget_copy, R.drawable.ic_widget_add)
      views.setContentDescription(R.id.widget_copy, context.getString(R.string.widget_choose_description))
      views.setTextViewText(
        R.id.widget_name,
        context.getString(if (lost) R.string.widget_unavailable_title else R.string.widget_empty_title),
      )
      views.setTextViewText(
        R.id.widget_address,
        context.getString(if (lost) R.string.widget_unavailable_body else R.string.widget_empty_body),
      )
      views.setOnClickPendingIntent(R.id.widget_root, choose)
      views.setOnClickPendingIntent(R.id.widget_copy, choose)
      appWidgetManager.updateAppWidget(appWidgetId, views)
      return
    }

    views.setViewVisibility(R.id.widget_details, if (sizing.showDetails) View.VISIBLE else View.GONE)
    views.setViewVisibility(R.id.widget_qr, if (sizing.qrDp > 0) View.VISIBLE else View.GONE)
    views.setViewVisibility(R.id.widget_copy, View.VISIBLE)
    // Set rather than left to the layout: a launcher reapplies a new render over the views it
    // already has, so a widget that was empty a second ago would keep the plus it was drawn with.
    views.setImageViewResource(R.id.widget_copy, R.drawable.ic_widget_copy)
    views.setContentDescription(R.id.widget_copy, context.getString(R.string.widget_copy_description))
    views.setTextViewText(R.id.widget_name, contact.name)
    views.setTextViewText(R.id.widget_address, addressText(layout, widthDp, contact.address))

    if (sizing.qrDp > 0) {
      val density = context.resources.displayMetrics.density
      QrBitmap.encode(contact.address, (sizing.qrDp * density).toInt())?.let {
        views.setImageViewBitmap(R.id.widget_qr, it)
      }
      views.setContentDescription(R.id.widget_qr, context.getString(R.string.widget_qr_description, contact.name))
    }

    views.setOnClickPendingIntent(R.id.widget_root, openIntent(context, contact.id))
    views.setOnClickPendingIntent(R.id.widget_copy, copyIntent(context, appWidgetId))

    appWidgetManager.updateAppWidget(appWidgetId, views)
  }

  /**
   * Which of the three shapes the cell the user gave us can actually hold.
   *
   * Height decides first: under two rows there is no room for a code beside anything, so that size
   * is the strip whatever its width. Above it, only a four-cell width has room for the full address
   * next to the code.
   */
  private fun layoutFor(widthDp: Int, heightDp: Int): Layout = when {
    widthDp <= 0 || heightDp <= 0 -> defaultLayout
    heightDp < TWO_ROW_HEIGHT_DP -> Layout.STRIP
    widthDp >= PANEL_WIDTH_DP -> Layout.PANEL
    else -> Layout.COMPACT
  }

  /**
   * How large the code may be drawn, and whether the name and address still fit beside it.
   *
   * The code is drawn to the cell it was given rather than to a fixed size: a resized widget that
   * keeps a 96dp code either wastes half its space or overflows it. A size of 0 means no code at
   * all — the strip only earns one once it is wide enough that the text does not lose by it.
   */
  private fun sizingFor(layout: Layout, widthDp: Int, heightDp: Int): Sizing {
    if (widthDp <= 0 || heightDp <= 0) {
      return Sizing(if (layout == Layout.STRIP) 0 else DEFAULT_QR_DP, true)
    }

    return when (layout) {
      Layout.STRIP -> {
        val available = heightDp - STRIP_CHROME_DP
        val earnsCode = widthDp >= WIDE_STRIP_WIDTH_DP && available >= STRIP_MIN_QR_DP
        Sizing(if (earnsCode) available.coerceAtMost(MAX_QR_DP) else 0, true)
      }

      Layout.COMPACT -> {
        val besideText = minOf(widthDp - COMPACT_SIDE_CHROME_DP, heightDp - COMPACT_CHROME_DP)
        // Below that floor the name costs more than it tells: the code it would shrink is the
        // whole reason this size exists, so the text goes and the code takes the height back.
        val showDetails = besideText >= COMPACT_DETAILS_FLOOR_DP
        val available =
          if (showDetails) besideText else minOf(widthDp - COMPACT_SIDE_CHROME_DP, heightDp - COMPACT_BARE_CHROME_DP)
        Sizing(available.coerceIn(MIN_QR_DP, MAX_QR_DP), showDetails)
      }

      Layout.PANEL -> {
        val available = minOf(heightDp - PANEL_CHROME_DP, widthDp - PANEL_SIDE_CHROME_DP)
        Sizing(available.coerceIn(MIN_QR_DP, MAX_QR_DP), true)
      }
    }
  }

  /**
   * The panel is the one size with room for every character, and the address is what a user checks
   * before sending to it — so there it is shown whole. Everywhere else it is shortened from both
   * ends, because a look-alike address usually differs at the tail.
   */
  private fun addressText(layout: Layout, widthDp: Int, address: String): String = when {
    layout == Layout.PANEL -> address
    layout == Layout.STRIP && widthDp >= WIDE_STRIP_WIDTH_DP -> ellipsify(address, WIDE_STRIP_KEEP)
    else -> ellipsify(address, SHORT_KEEP)
  }

  private fun ellipsify(address: String, keep: Int): String =
    if (address.length <= keep * 2 + 4) address else "${address.take(keep)}…${address.takeLast(keep)}"

  /** What one render decided: the code's edge in dp, and whether the text block survived it. */
  private data class Sizing(val qrDp: Int, val showDetails: Boolean)

  /** Opens the contact the widget is showing. The empty state uses [chooseIntent] instead. */
  private fun openIntent(context: Context, contactId: String): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("solcontacts://contact/$contactId"))
      .setPackage(context.packageName)
    return PendingIntent.getActivity(
      context,
      contactId.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  /** Opens the app at the contact picker for this widget — the empty state's only action. */
  private fun chooseIntent(context: Context, appWidgetId: Int): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("solcontacts://widget/$appWidgetId"))
      .setPackage(context.packageName)
    return PendingIntent.getActivity(
      context,
      appWidgetId,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun copyIntent(context: Context, appWidgetId: Int): PendingIntent {
    // `javaClass`, not this class: a widget of another size is a different receiver, and its copy
    // button has to broadcast back to the component that is actually drawing it.
    val intent = Intent(context, javaClass)
      .setAction(ACTION_COPY)
      .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
    return PendingIntent.getBroadcast(
      context,
      // Distinct per widget: two widgets sharing a request code would share one intent, and the
      // second would copy the first one's address.
      appWidgetId,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  /** The three shapes a contact can be drawn as, whatever size it was pinned at. */
  enum class Layout(val resource: Int) {
    /** One row: name, shortened address, copy button — and the code too, once it is wide enough. */
    STRIP(R.layout.contact_widget_strip),

    /** A square: name and address on top, the code and the copy button sharing the row below. */
    COMPACT(R.layout.contact_widget_compact),

    /** Wide and two rows tall: the whole address beside the code, copy button at the end. */
    PANEL(R.layout.contact_widget),
  }

  companion object {
    const val ACTION_PINNED = "com.solcontacts.app.widget.PINNED"
    const val ACTION_COPY = "com.solcontacts.app.widget.COPY"
    const val EXTRA_CONTACT_ID = "contactId"

    /** Two rows of a launcher grid, in portrait. Under it, nothing but the strip fits. */
    private const val TWO_ROW_HEIGHT_DP = 130

    /** Four cells across: the width at which the whole address fits beside the code. */
    private const val PANEL_WIDTH_DP = 300

    /** Three cells across: below it a strip is all text, because a code would crowd the name out. */
    private const val WIDE_STRIP_WIDTH_DP = 200

    // Everything each layout spends before the code gets what is left: padding, the copy button,
    // the gap beside it, the white quiet zone, and — where it is drawn — the text block.
    private const val STRIP_CHROME_DP = 26
    private const val STRIP_MIN_QR_DP = 48
    private const val COMPACT_SIDE_CHROME_DP = 84
    private const val COMPACT_CHROME_DP = 72
    private const val COMPACT_BARE_CHROME_DP = 40
    private const val COMPACT_DETAILS_FLOOR_DP = 64
    private const val PANEL_CHROME_DP = 40
    private const val PANEL_SIDE_CHROME_DP = 232

    private const val DEFAULT_QR_DP = 96
    private const val MIN_QR_DP = 40
    private const val MAX_QR_DP = 180

    /** Characters kept at each end of a shortened address. */
    private const val SHORT_KEEP = 4
    private const val WIDE_STRIP_KEEP = 8

    /** Every provider the manifest registers — one per size offered in the launcher's picker. */
    val PROVIDERS: List<Class<out ContactWidgetProvider>> = listOf(
      ContactWidgetProvider::class.java,
      ContactWidgetRowProvider::class.java,
      ContactWidgetWideProvider::class.java,
    )

    /**
     * Redraw one widget, whichever size it happens to be. `false` means no provider owns that id
     * any more — the widget was removed from the home screen while the app was looking at it.
     */
    fun renderOne(context: Context, appWidgetId: Int): Boolean {
      val manager = AppWidgetManager.getInstance(context)
      val provider = PROVIDERS.firstOrNull { manager.getAppWidgetIds(ComponentName(context, it)).contains(appWidgetId) }
        ?: return false

      val intent = Intent(context, provider)
        .setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
        .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
      context.sendBroadcast(intent)
      return true
    }

    /** Redraw every pinned widget — the app calls this after any change to the contact book. */
    fun renderAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)

      PROVIDERS.forEach { provider ->
        val ids = manager.getAppWidgetIds(ComponentName(context, provider))
        if (ids.isEmpty()) return@forEach

        val intent = Intent(context, provider)
          .setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
          .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        context.sendBroadcast(intent)
      }
    }
  }
}
