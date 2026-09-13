package expo.modules.contactwidget

/**
 * The sizes a contact can be pinned at, beyond the 2x2 square that [ContactWidgetProvider] itself
 * provides. Each one exists only to carry its own `appwidget-provider` metadata into the manifest:
 * a launcher's picker offers providers, not sizes, so a size the user can choose up front needs a
 * receiver of its own. All the drawing stays in the base class.
 */

/** Two cells by one: name, shortened address, copy button. */
class ContactWidgetRowProvider : ContactWidgetProvider() {
  override val defaultLayout = Layout.STRIP
}

/** Four cells by one: the same row, with room for a longer name. */
class ContactWidgetWideProvider : ContactWidgetProvider() {
  override val defaultLayout = Layout.STRIP
}
