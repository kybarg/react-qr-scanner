import BinaryBitmap from '@zxing/library/cjs/core/BinaryBitmap'
import HybridBinarizer from '@zxing/library/cjs/core/common/HybridBinarizer'
import RGBLuminanceSource from '@zxing/library/cjs/core/RGBLuminanceSource'
import QRCodeReader from '@zxing/library/cjs/core/qrcode/QRCodeReader'

const toGrayscaleBuffer = function (imageBuffer, width, height) {
  var grayscaleBuffer = new Uint8ClampedArray(width * height);
  for (var i = 0, j = 0, length_1 = imageBuffer.length; i < length_1; i += 4, j++) {
    var gray = void 0;
    var alpha = imageBuffer[i + 3];
    // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
    // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
    // barcode image. Force any such pixel to be white:
    if (alpha === 0) {
      gray = 0xFF;
    }
    else {
      var pixelR = imageBuffer[i];
      var pixelG = imageBuffer[i + 1];
      var pixelB = imageBuffer[i + 2];
      // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
      // (306*R) >> 10 is approximately equal to R*0.299, and so on.
      // 0x200 >> 10 is 0.5, it implements rounding.
      gray = (306 * pixelR +
        601 * pixelG +
        117 * pixelB +
        0x200) >> 10;
    }
    grayscaleBuffer[j] = gray;
  }
  return grayscaleBuffer;
}

const reader = new QRCodeReader()

self.addEventListener('message', (e) => { // eslint-disable-line no-restricted-globals
  try {
    const luminances = toGrayscaleBuffer(e.data.data, e.data.width, e.data.height)
    const luminanceSource = new RGBLuminanceSource(luminances, e.data.width, e.data.height)
    const hybridBinarizer = new HybridBinarizer(luminanceSource);
    const binaryBitmap = new BinaryBitmap(hybridBinarizer);
    const decoded = reader.decode(binaryBitmap)
    postMessage(decoded)
  } catch (err) {
    postMessage(null)
  }
})
