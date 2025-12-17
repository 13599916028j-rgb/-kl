import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { TreeMode, HandPosition } from '../types';

interface HandControllerProps {
  setMode: (mode: TreeMode) => void;
  onHandMove: (pos: HandPosition) => void;
}

const HandController: React.FC<HandControllerProps> = ({ setMode, onHandMove }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const lastPredictionTime = useRef<number>(0);

  // Initialize MediaPipe
  useEffect(() => {
    let isMounted = true;
    let recognizerInstance: GestureRecognizer | null = null;

    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        if (!isMounted) return;

        recognizerInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            // Use GPU if available. The "XNNPACK" log indicates CPU fallback, which we handle via throttling below.
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (!isMounted) {
            recognizerInstance.close();
            return;
        }

        recognizerRef.current = recognizerInstance;
        startWebcam();
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
        if (isMounted) setError("AI Model Failed");
      }
    };

    initMediaPipe();

    return () => {
        isMounted = false;
        if (recognizerRef.current) {
            recognizerRef.current.close();
            recognizerRef.current = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'user',
            width: { ideal: 320 },
            height: { ideal: 240 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setLoaded(true);
      }
    } catch (err: any) {
      console.error("Webcam error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Please Allow Camera Access");
      } else {
          setError("Camera Error");
      }
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;

    if (!video || !recognizer) return;
    
    // Ensure video dimensions are valid to prevent WebGL errors
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
    }

    const now = Date.now();
    // Throttle prediction to ~15 FPS (66ms) to prevent main thread blocking 
    // if MediaPipe falls back to CPU (XNNPACK delegate).
    if (now - lastPredictionTime.current < 66) {
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
    }
    lastPredictionTime.current = now;

    try {
        const results = recognizer.recognizeForVideo(video, now);

        if (results.gestures.length > 0 && results.landmarks.length > 0) {
            const gesture = results.gestures[0][0].categoryName;
            const landmarks = results.landmarks[0];
            
            // Mode Control
            if (gesture === "Open_Palm") {
              setMode('CHAOS');
            } else if (gesture === "Closed_Fist") {
              setMode('FORMED');
            }

            // View Control (Calculate centroid of hand)
            let sumX = 0;
            let sumY = 0;
            landmarks.forEach(lm => {
                sumX += lm.x;
                sumY += lm.y;
            });
            const centerX = sumX / landmarks.length;
            const centerY = sumY / landmarks.length;

            onHandMove({ x: centerX, y: centerY, active: true });
        } else {
            onHandMove({ x: 0.5, y: 0.5, active: false });
        }
    } catch (e) {
        console.warn("Recognition error:", e);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <>
      <video 
        ref={videoRef} 
        id="webcam-preview" 
        autoPlay 
        playsInline 
        muted
      />
      {!loaded && !error && (
        <div className="absolute bottom-8 right-8 text-[#C5A000] font-luxury text-sm animate-pulse z-50">
          Initializing Magic...
        </div>
      )}
      {error && (
         <div className="absolute bottom-8 right-8 text-red-500 font-luxury text-sm z-50 bg-black/80 p-2 rounded border border-red-500/50">
         {error}
       </div>
      )}
    </>
  );
};

export default HandController;