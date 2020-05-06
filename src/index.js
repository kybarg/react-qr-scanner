import React, { Component } from 'react'
import PropTypes from 'prop-types'
import getDeviceId from './getDeviceId'
import havePropsChanged from './havePropsChanged'

// Require adapter to support older browser implementations
require('webrtc-adapter')

// Inline worker.js as a string value of workerBlob.
const workerBlob = new Blob([__inline('../lib/worker.js')], {
  type: 'application/javascript',
})

// Props that are allowed to change dynamicly
const propsKeys = ['delay', 'legacyMode', 'facingMode']

class Reader extends Component {
  
  constructor(props) {
    super(props)
    
    this.els = {}
    // Bind function to the class
    this.initiate = this.initiate.bind(this)
    this.initiateLegacyMode = this.initiateLegacyMode.bind(this)
    this.check = this.check.bind(this)
    this.handleVideo = this.handleVideo.bind(this)
    this.handleLoadStart = this.handleLoadStart.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.clearComponent = this.clearComponent.bind(this)
    this.handleReaderLoad = this.handleReaderLoad.bind(this)
    this.openImageDialog = this.openImageDialog.bind(this)
    this.handleWorkerMessage = this.handleWorkerMessage.bind(this)
    this.setRefFactory = this.setRefFactory.bind(this)
  }

  componentDidMount() {
    // Initiate web worker execute handler according to mode.
    this.worker = new Worker(URL.createObjectURL(workerBlob))
    this.worker.onmessage = this.handleWorkerMessage

    if (!this.props.legacyMode) {
      this.initiate()
    } else {
      this.initiateLegacyMode()
    }
  }

  shouldComponentUpdate(nextProps) {
    // React according to change in props
    const changedProps = havePropsChanged(this.props, nextProps, propsKeys)

    for (const prop of changedProps) {
      if (prop === 'facingMode') {
        this.clearComponent()
        this.initiate(nextProps)
        break
      } else if (prop === 'delay') {
        if (this.props.delay === false && !nextProps.legacyMode) {
          this.timeout = setTimeout(this.check, nextProps.delay)
        }
        if (nextProps.delay === false) {
          clearTimeout(this.timeout)
        }
      } else if (prop === 'legacyMode') {
        if (this.props.legacyMode && !nextProps.legacyMode) {
          this.clearComponent()
          this.initiate(nextProps)
        } else {
          this.clearComponent()
          this.componentDidUpdate = this.initiateLegacyMode
        }
        break
      }
    }

    // Only render when the `propsKeys` have changed.
    return changedProps.length > 0
  }

  componentWillUnmount() {
    // Stop web-worker and clear the component
    if (this.worker) {
      this.worker.terminate()
      this.worker = undefined
    }
    this.clearComponent()
  }

  clearComponent() {
    // Remove all event listeners and variables
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = undefined
    }
    if (this.stopCamera) {
      this.stopCamera()
    }
    if (this.reader) {
      this.reader.removeEventListener('load', this.handleReaderLoad)
    }
    if (this.els.img) {
      this.els.img.removeEventListener('load', this.check)
    }
  }

  initiate(props = this.props) {
    const { onError, facingMode, chooseDeviceId } = props

    getDeviceId(facingMode, chooseDeviceId)
      .then(deviceId => {
        return navigator.mediaDevices.getUserMedia({
          video: {
            deviceId,
            width: { min: 360, ideal: 1280, max: 1920 },
            height: { min: 240, ideal: 720, max: 1080 },
          },
        })
      })
      .then(this.handleVideo)
      .catch(onError)
  }

  handleVideo(stream) {
    const { preview } = this.els

    // Handle different browser implementations of MediaStreams as src
    if (preview.srcObject !== undefined) {
      preview.srcObject = stream
    } else if (preview.mozSrcObject !== undefined) {
      preview.mozSrcObject = stream
    } else if (window.URL.createObjectURL) {
      preview.src = window.URL.createObjectURL(stream)
    } else if (window.webkitURL) {
      preview.src = window.webkitURL.createObjectURL(stream)
    } else {
      preview.src = stream
    }

    // IOS play in fullscreen
    preview.playsInline = true

    const streamTrack = stream.getTracks()[0]
    // Assign `stopCamera` so the track can be stopped once component is cleared
    this.stopCamera = streamTrack.stop.bind(streamTrack)

    preview.addEventListener('loadstart', this.handleLoadStart)
  }

  handleLoadStart() {
    const { delay, onLoad } = this.props
    const preview = this.els.preview
    preview.play()

    if (typeof onLoad === 'function') {
      onLoad()
    }

    if (typeof delay === 'number') {
      this.timeout = setTimeout(this.check, delay)
    }

    // Some browsers call loadstart continuously
    preview.removeEventListener('loadstart', this.handleLoadStart)
  }

  check() {
    const { legacyMode, maxImageSize, delay } = this.props
    const { preview, canvas, img } = this.els

    // Get image/video dimensions
    let width = Math.floor(legacyMode ? img.naturalWidth : preview.videoWidth)
    let height = Math.floor(
      legacyMode ? img.naturalHeight : preview.videoHeight
    )

    if (legacyMode) {
      // Downscale image to `maxImageSize`
      const greatestSize = width > height ? width : height
      if (greatestSize > maxImageSize) {
        const ratio = maxImageSize / greatestSize
        height = ratio * height
        width = ratio * width
      }
    }

    canvas.width = width
    canvas.height = height

    const previewIsPlaying = preview &&
      preview.readyState === preview.HAVE_ENOUGH_DATA

    if (legacyMode || previewIsPlaying) {
      const ctx = canvas.getContext('2d')
      ctx.drawImage(legacyMode ? img : preview, 0, 0, width, height)

      const imageData = ctx.getImageData(0, 0, width, height)
      // Send data to web-worker
      this.worker.postMessage(imageData)
    } else {
      // Preview not ready -> check later
      this.timeout = setTimeout(this.check, delay)
    }
  }

  handleWorkerMessage(e) {
    const { onScan, legacyMode, delay } = this.props
    const decoded = e.data

    onScan((decoded && decoded.data) || null)

    if (!legacyMode && typeof delay === 'number' && this.worker) {
      this.timeout = setTimeout(this.check, delay)
    }
  }

  initiateLegacyMode() {
    this.reader = new FileReader()
    this.reader.addEventListener('load', this.handleReaderLoad)
    this.els.img.addEventListener('load', this.check, false)

    // Reset componentDidUpdate
    this.componentDidUpdate = undefined

    if (typeof this.props.onLoad === 'function') {
      this.props.onLoad()
    }
  }

  handleInputChange(e) {
    const selectedImg = e.target.files[0]
    this.reader.readAsDataURL(selectedImg)
  }

  handleReaderLoad(e) {
    // Set selected image blob as img source
    this.els.img.src = e.target.result
  }

  openImageDialog() {
    // Function to be executed by parent in user action context to trigger img file uploader
    this.els.input.click()
  }

  setRefFactory(key) {
    return element => {
      this.els[key] = element
    }
  }

  render() {
    const { style, className, onImageLoad, legacyMode } = this.props

    const hiddenStyle = { display: 'none' }
    const previewStyle = {
      display: 'block',
      objectFit: 'contain',
      ...style,
    }

    return (
      <section className={className}>
        {legacyMode
          ? <div>
            <input
              style={hiddenStyle}
              type="file"
              accept="image/*"
              ref={this.setRefFactory('input')}
              onChange={this.handleInputChange}
            />
            <img style={previewStyle} ref={this.setRefFactory('img')} onLoad={onImageLoad} />
          </div>
          : <video style={previewStyle} ref={this.setRefFactory('preview')} />}
        <canvas style={hiddenStyle} ref={this.setRefFactory('canvas')} />
      </section>
    )
  }
}

Reader.propTypes = {
  onScan: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onLoad: PropTypes.func,
  onImageLoad: PropTypes.func,
  delay: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  facingMode: PropTypes.oneOf(['rear', 'front']),
  legacyMode: PropTypes.bool,
  maxImageSize: PropTypes.number,
  style: PropTypes.any,
  className: PropTypes.string,
  chooseDeviceId: PropTypes.func,
}

Reader.defaultProps = {
  delay: 500,
  maxImageSize: 1000,
  facingMode: 'rear',
}

export default Reader