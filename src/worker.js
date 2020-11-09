import jsQR from 'jsqr'

self.addEventListener('message', (e) => { // eslint-disable-line no-restricted-globals
  const decoded = jsQR(
    e.data.data,
    e.data.width,
    e.data.height
  )
  postMessage(decoded)
})
