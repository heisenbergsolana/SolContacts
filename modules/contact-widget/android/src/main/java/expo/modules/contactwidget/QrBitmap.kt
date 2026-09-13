package expo.modules.contactwidget

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

/**
 * The address as a scannable code, always black on white.
 *
 * The quiet zone stays white whatever the widget sits on: scanners need the contrast, and an
 * inverted code is unreliable on many readers. Same rule as the in-app QR.
 */
object QrBitmap {
  fun encode(value: String, sizePx: Int): Bitmap? {
    return try {
      val hints = mapOf(
        EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
        EncodeHintType.MARGIN to 1,
        EncodeHintType.CHARACTER_SET to "UTF-8",
      )
      val matrix = QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, sizePx, sizePx, hints)
      val pixels = IntArray(sizePx * sizePx)

      for (y in 0 until sizePx) {
        val row = y * sizePx
        for (x in 0 until sizePx) {
          pixels[row + x] = if (matrix.get(x, y)) Color.BLACK else Color.WHITE
        }
      }

      Bitmap.createBitmap(pixels, sizePx, sizePx, Bitmap.Config.ARGB_8888)
    } catch (error: Exception) {
      // An address that will not encode is a bug worth showing as a blank slot, not a crash in
      // the launcher process that hosts the widget.
      null
    }
  }
}
