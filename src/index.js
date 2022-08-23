import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import WebWorker from "web-worker:./worker";

const createWorker = () => new WebWorker();

const stopMediaStream = (stream) => {
  if (stream) {
    if (stream.getVideoTracks && stream.getAudioTracks) {
      stream.getVideoTracks().forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
      stream.getAudioTracks().forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
    } else {
      stream.stop();
    }
  }
};

const Reader = (props) => {
  const { constraints, onError, onLoad, onScan, resolution, ...other } = props;
  const constraintsStr = JSON.stringify(constraints);

  const streamRef = useRef(null);
  const videoEl = useRef(null);
  const canvasEl = useRef(document.createElement("canvas"));
  const ctxRef = useRef(null);
  const requestRef = useRef();
  const [src, setSrc] = useState(null);

  const isProcessingRef = useRef(false);
  const worker = useMemo(createWorker, [createWorker]);

  useEffect(() => {
    return () => {
      worker.terminate();
    };
  }, [worker]);

  useEffect(() => {
    worker.onerror = (event) => {
      console.log("error", event);
    };

    worker.onmessage = (e) => {
      if (onScan)
        onScan(e.data ? { ...e.data, canvas: canvasEl.current } : null);
      isProcessingRef.current = false;
    };
  }, [onScan, worker]);

  const check = useCallback(() => {
    const videoIsPlaying =
      videoEl.current &&
      videoEl.current.readyState === videoEl.current.HAVE_ENOUGH_DATA;

    if (!isProcessingRef.current && videoIsPlaying) {
      isProcessingRef.current = true;

      // Get image/video dimensions
      let width = videoEl.current.videoWidth;
      let height = videoEl.current.videoHeight;

      const greatestSize = width > height ? width : height;
      const ratio = resolution / greatestSize;

      height = ratio * height;
      width = ratio * width;

      canvasEl.current.width = width;
      canvasEl.current.height = height;

      ctxRef.current = canvasEl.current.getContext("2d");
      ctxRef.current.drawImage(videoEl.current, 0, 0, width, height);
      const imageData = ctxRef.current.getImageData(0, 0, width, height);
      // Send data to web-worker
      worker.postMessage(imageData);
    }

    requestRef.current = requestAnimationFrame(check);
  }, [resolution, worker]);

  useEffect(() => {
    const constraints = JSON.parse(constraintsStr);

    let isSubscribed = true;
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (!isSubscribed) {
          stopMediaStream(stream);
        } else {
          streamRef.current = stream;

          try {
            if (videoEl.current) {
              videoEl.current.srcObject = stream;
              videoEl.current.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
            }
          } catch (error) {
            setSrc(window.URL.createObjectURL(stream));
          }

          if (onLoad) onLoad();

          requestRef.current = requestAnimationFrame(check);
        }
      })
      .catch((error) => (isSubscribed ? onError(error) : null));

    return () => {
      cancelAnimationFrame(requestRef.current);
      isSubscribed = false;
      stopMediaStream(streamRef.current);
      if (src) {
        window.URL.revokeObjectURL(src);
      }
    };
  }, [check, constraintsStr, onError, onLoad, src]);

  return <video autoPlay playsInline src={src} ref={videoEl} {...other} />;
};

Reader.propTypes = {
  constraints: PropTypes.object,
  onError: PropTypes.func.isRequired,
  onLoad: PropTypes.func,
  onScan: PropTypes.func.isRequired,
  resolution: PropTypes.number,
};

Reader.defaultProps = {
  constraints: { audio: false, video: true },
  resolution: 640,
};

export default Reader;
