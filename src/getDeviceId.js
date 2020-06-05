const { NoVideoInputDevicesError } = require('./errors')

function defaultDeviceIdChooser(filteredDevices, videoDevices) {
  return (filteredDevices.length > 0)
    ? filteredDevices[0].deviceId
    // No device found with the pattern thus use another video device
    : videoDevices[0].deviceId
}

function getDeviceId(facingMode, chooseDeviceId = defaultDeviceIdChooser) {
  // Get manual deviceId from available devices.
  return new Promise((resolve, reject) => {
    let enumerateDevices
    try{
      enumerateDevices = navigator.mediaDevices.enumerateDevices()
    }catch(err){
      reject(new NoVideoInputDevicesError())
    }
    enumerateDevices.then(devices => {
      // Filter out non-videoinputs
      const videoDevices = devices.filter(
        device => device.kind == 'videoinput'
      )

      if (videoDevices.length < 1) {
        reject(new NoVideoInputDevicesError())
        return
      } else if (videoDevices.length == 1) {
        // Only 1 video device available thus stop here
        resolve(videoDevices[0].deviceId)
        return
      }

      const pattern = facingMode == 'rear'
        ? /rear|back|environment/ig
        : /front|user|face/ig

      // Filter out video devices without the pattern
      const filteredDevices = videoDevices.filter(({ label }) =>
        pattern.test(label))

      resolve(chooseDeviceId(filteredDevices, videoDevices))
    })
  })
}

export default getDeviceId