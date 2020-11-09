import 'webrtc-adapter'
import React, { useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import WebWorker from 'web-worker:./worker'
// Require adapter to support older browser implementations

const createWorker = () => new WebWorker()

const hiddenStyle = { display: 'none' }
const videoStyle = {
  display: 'block',
  objectFit: 'contain',
}

const Reader = (props) => {
  const { constraints, onError, onLoad, onScan, resolution, ...other } = props

  const streamRef = useRef(null)
  const videoEl = useRef(null)
  const canvasEl = useRef(null)
  const ctxRef = useRef(null)
  const requestRef = useRef(undefined)

  const isProcessingRef = useRef(false)
  const worker = useMemo(createWorker, [createWorker])
  useEffect(() => {
    worker.onmessage = (e) => {
      isProcessingRef.current = false
      const imageData = ctxRef.current.getImageData(0, 0, canvasEl.current.width, canvasEl.current.height)
      if (onScan) onScan(e.data ? { ...e.data, imageData } : null)
    }

    return () => worker.terminate()
  })

  const check = () => {
    // Get image/video dimensions
    let width = videoEl.current.videoWidth
    let height = videoEl.current.videoHeight

    const greatestSize = width > height ? width : height
    const ratio = resolution / greatestSize

    height = ratio * height
    width = ratio * width

    canvasEl.current.width = width
    canvasEl.current.height = height

    const videoIsPlaying = videoEl.current && videoEl.current.readyState === videoEl.current.HAVE_ENOUGH_DATA

    if (!isProcessingRef.current && videoIsPlaying) {
      isProcessingRef.current = true

      ctxRef.current = canvasEl.current.getContext('2d')
      ctxRef.current.drawImage(videoEl.current, 0, 0, width, height)
      const imageData = ctxRef.current.getImageData(0, 0, width, height)
      // Send data to web-worker
      worker.postMessage(imageData)
    }

    requestRef.current = requestAnimationFrame(check)
  }

  useEffect(() => {
    if (!videoEl) {
      return
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        streamRef.current = stream

        videoEl.current.srcObject = stream
        videoEl.current.setAttribute('playsinline', true) // required to tell iOS safari we don't want fullscreen
        videoEl.current.play()

        if (typeof onLoad === 'function') onLoad()

        requestRef.current = requestAnimationFrame(check)
      })
      .catch(onError)

    return () => {
      cancelAnimationFrame(requestRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  })

  return (
    <>
      <video style={videoStyle} ref={videoEl} {...other} />
      <canvas style={hiddenStyle} ref={canvasEl} />
    </>
  )
}

Reader.propTypes = {
  className: PropTypes.string,
  constraints: PropTypes.object,
  onError: PropTypes.func.isRequired,
  onLoad: PropTypes.func,
  onScan: PropTypes.func.isRequired,
  resolution: PropTypes.number,
}

Reader.defaultProps = {
  constraints: { audio: false, video: true },
  resolution: 600,
}

export default Reader
