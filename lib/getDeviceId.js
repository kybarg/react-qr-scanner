var _require = require('./errors'),
    NoVideoInputDevicesError = _require.NoVideoInputDevicesError;

function defaultDeviceIdChooser(filteredDevices, videoDevices) {
  return filteredDevices.length > 0 ? filteredDevices[0].deviceId // No device found with the pattern thus use another video device
  : videoDevices[0].deviceId;
}

function getDeviceId(facingMode) {
  var chooseDeviceId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultDeviceIdChooser;
  // Get manual deviceId from available devices.
  return new Promise(function (resolve, reject) {
    var enumerateDevices;

    try {
      enumerateDevices = navigator.mediaDevices.enumerateDevices();
    } catch (err) {
      reject(new NoVideoInputDevicesError());
    }

    enumerateDevices.then(function (devices) {
      // Filter out non-videoinputs
      var videoDevices = devices.filter(function (device) {
        return device.kind == 'videoinput';
      });

      if (videoDevices.length < 1) {
        reject(new NoVideoInputDevicesError());
        return;
      } else if (videoDevices.length == 1) {
        // Only 1 video device available thus stop here
        resolve(videoDevices[0].deviceId);
        return;
      }

      var pattern = facingMode == 'rear' ? /rear|back|environment/ig : /front|user|face/ig; // Filter out video devices without the pattern

      var filteredDevices = videoDevices.filter(function (_ref) {
        var label = _ref.label;
        return pattern.test(label);
      });
      resolve(chooseDeviceId(filteredDevices, videoDevices));
    });
  });
}

export default getDeviceId;