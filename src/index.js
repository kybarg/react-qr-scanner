import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import WebWorker from 'web-worker:./worker'

const createWorker = () => new WebWorker()

const Reader = (props) => {
  const { constraints, mirrored, onError, onLoad, onScan, resolution, ...other } = props
  const constraintsStr = JSON.stringify(constraints)

  const streamRef = useRef(null)
  const videoEl = useRef(null)
  const canvasEl = useRef(document.createElement('canvas'))
  const ctxRef = useRef(null)
  const requestRef = useRef()
  const cancelRef = useRef(false)

  const isProcessingRef = useRef(false)
  const worker = useMemo(createWorker, [createWorker])
  useEffect(() => {
    worker.onmessage = (e) => {
      if (onScan) onScan(e.data ? { ...e.data, canvas: canvasEl.current } : null)
      isProcessingRef.current = false
    }

    return () => worker.terminate()
  }, [onScan, worker])

  const check = useCallback(() => {
    const videoIsPlaying = videoEl.current && videoEl.current.readyState === videoEl.current.HAVE_ENOUGH_DATA

    if (!isProcessingRef.current && videoIsPlaying) {
      isProcessingRef.current = true

      // Get image/video dimensions
      let width = videoEl.current.videoWidth
      let height = videoEl.current.videoHeight

      const greatestSize = width > height ? width : height
      const ratio = resolution / greatestSize

      height = ratio * height
      width = ratio * width

      canvasEl.current.width = width
      canvasEl.current.height = height

      ctxRef.current = canvasEl.current.getContext('2d')
      ctxRef.current.drawImage(videoEl.current, 0, 0, width, height)
      const imageData = ctxRef.current.getImageData(0, 0, width, height)
      // Send data to web-worker
      worker.postMessage(imageData)
    }

    requestRef.current = requestAnimationFrame(check)
  }, [resolution, worker])

  useEffect(() => {
    if (!videoEl) return

    const constraints = JSON.parse(constraintsStr)
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        if (cancelRef.current) return
        streamRef.current = stream

        videoEl.current.srcObject = stream
        videoEl.current.setAttribute('playsinline', true) // required to tell iOS safari we don't want fullscreen
        videoEl.current.play()

        if (typeof onLoad === 'function') onLoad()

        requestRef.current = requestAnimationFrame(check)
      })
      .catch(onError)

    return () => {
      cancelRef.current = true
      cancelAnimationFrame(requestRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [check, constraintsStr, onError, onLoad])

  return (<video ref={videoEl} {...other} />)
}

Reader.propTypes = {
  constraints: PropTypes.object,
  onError: PropTypes.func.isRequired,
  onLoad: PropTypes.func,
  onScan: PropTypes.func.isRequired,
  resolution: PropTypes.number,
}

Reader.defaultProps = {
  constraints: { audio: false, video: true },
  resolution: 640,
}

export default Reader
