import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, QRCodeReader, HTMLCanvasElementLuminanceSource } from '@zxing/library/cjs'
const reader = new QRCodeReader()

self.addEventListener('message', (e) => { // eslint-disable-line no-restricted-globals
  const data = HTMLCanvasElementLuminanceSource.toGrayscaleBuffer(e.data.data, e.data.width, e.data.height)
  const luminanceSource = new RGBLuminanceSource(data, e.data.width, e.data.height)
  const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource))
  try {
    const decoded = reader.decode(binaryBitmap)
    console.log(decoded)
    postMessage(decoded)
  } catch (err) {
    postMessage(null)
  }
})
