function NoVideoInputDevicesError() {
  var err = new Error();
  err.name = 'NoVideoInputDevicesError';
  err.message = 'No video input devices found';
}

NoVideoInputDevicesError.propType = new Error();
export { NoVideoInputDevicesError };