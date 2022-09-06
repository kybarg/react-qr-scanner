import * as React from "react";
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
  const { constraints, onError, onLoad, onScan, resolution, qrArea, ...other } =
    props;
  const streamRef = React.useRef(null);
  const videoEl = React.useRef(null);
  const canvasEl = React.useRef(document.createElement("canvas"));
  const ctxRef = React.useRef(null);
  const requestRef = React.useRef();
  const [src, setSrc] = React.useState(null);

  const isProcessingRef = React.useRef(false);
  const workerRef = React.useRef();

  React.useEffect(() => {
    workerRef.current = createWorker();
    const worker = workerRef.current;

    worker.onmessage = (e) => {
      if (onScan)
        onScan(e.data ? { ...e.data, canvas: canvasEl.current } : null);
      isProcessingRef.current = false;
    };

    return () => {
      worker.terminate();
    };
  }, [onScan]);

  const qrAreaStr = JSON.stringify(qrArea);

  const check = React.useCallback(() => {
    const qrArea = JSON.parse(qrAreaStr);
    const worker = workerRef.current;

    const videoIsPlaying =
      videoEl.current &&
      videoEl.current.readyState === videoEl.current.HAVE_ENOUGH_DATA;

    if (!isProcessingRef.current && videoIsPlaying) {
      isProcessingRef.current = true;

      // Get image/video dimensions
      let width = videoEl.current.videoWidth;
      let height = videoEl.current.videoHeight;

      const greatestSize = width > height ? width : height;
      const ratio = Math.floor((resolution / greatestSize) * 100) / 100;

      height = Math.floor(ratio * height);
      width = Math.floor(ratio * width);

      canvasEl.current.width = width;
      canvasEl.current.height = height;

      ctxRef.current = canvasEl.current.getContext("2d");
      ctxRef.current.drawImage(videoEl.current, 0, 0, width, height);
      let imageData;
      if (qrArea && qrArea.length === 2 && qrArea[0] > 0 && qrArea[1] > 0) {
        imageData = ctxRef.current.getImageData(
          Math.floor((width - qrArea[0]) / 2),
          Math.floor((height - qrArea[1]) / 2),
          qrArea[0],
          qrArea[1]
        );
      } else {
        imageData = ctxRef.current.getImageData(0, 0, width, height);
      }

      // Send data to web-worker
      worker.postMessage(imageData);
    }

    requestRef.current = requestAnimationFrame(check);
  }, [resolution, qrAreaStr]);

  const constraintsStr = JSON.stringify(constraints);

  React.useEffect(() => {
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
  qrArea: PropTypes.array,
};

Reader.defaultProps = {
  constraints: { audio: false, video: true },
  resolution: 640,
  qrArea: [],
};

export default Reader;
