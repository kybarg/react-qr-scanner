function NoVideoInputDevicesError() {
  this.name = 'NoVideoInputDevicesError';
  this.message = 'No video input devices found';
}

NoVideoInputDevicesError.prototype = new Error();
export default {
  NoVideoInputDevicesError: NoVideoInputDevicesError
};