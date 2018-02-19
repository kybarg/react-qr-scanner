// jsQR is concatenated by gulp

self.addEventListener('message', function(e) {
  const decoded = jsQR(
    e.data.data,
    e.data.width,
    e.data.height
  )
  postMessage(decoded)
})
