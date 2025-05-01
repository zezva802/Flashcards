import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import * as fp from "fingerpose";
import "@tensorflow/tfjs-backend-webgl";
import "./GestureRecognizer.css";

interface GestureRecognizerProps {
  onGestureDetected?: (gesture: string) => void;
}

const GestureRecognizer: React.FC<GestureRecognizerProps> = ({
  onGestureDetected,
}) => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [gestureName, setGestureName] = useState<string>("No gesture detected");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  // Set up the custom gestures to recognize
  const createGestureEstimator = () => {
    const thumbsUp = new fp.GestureDescription("thumbs_up");
    thumbsUp.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    thumbsUp.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0);
    thumbsUp.addDirection(
      fp.Finger.Thumb,
      fp.FingerDirection.DiagonalUpLeft,
      0.75
    );
    thumbsUp.addDirection(
      fp.Finger.Thumb,
      fp.FingerDirection.DiagonalUpRight,
      0.75
    );
    for (let finger of [
      fp.Finger.Index,
      fp.Finger.Middle,
      fp.Finger.Ring,
      fp.Finger.Pinky,
    ]) {
      thumbsUp.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
    }

    const thumbsDown = new fp.GestureDescription("thumbs_down");
    thumbsDown.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    thumbsDown.addDirection(
      fp.Finger.Thumb,
      fp.FingerDirection.VerticalDown,
      1.0
    );
    thumbsDown.addDirection(
      fp.Finger.Thumb,
      fp.FingerDirection.DiagonalDownLeft,
      0.75
    );
    thumbsDown.addDirection(
      fp.Finger.Thumb,
      fp.FingerDirection.DiagonalDownRight,
      0.75
    );
    for (let finger of [
      fp.Finger.Index,
      fp.Finger.Middle,
      fp.Finger.Ring,
      fp.Finger.Pinky,
    ]) {
      thumbsDown.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
    }

    const victory = new fp.GestureDescription("victory");
    victory.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
    victory.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
    victory.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 0.7);
    victory.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 0.7);
    victory.addDirection(
      fp.Finger.Index,
      fp.FingerDirection.DiagonalUpLeft,
      0.5
    );
    victory.addDirection(
      fp.Finger.Index,
      fp.FingerDirection.DiagonalUpRight,
      0.5
    );
    victory.addDirection(
      fp.Finger.Middle,
      fp.FingerDirection.DiagonalUpLeft,
      0.5
    );
    victory.addDirection(
      fp.Finger.Middle,
      fp.FingerDirection.DiagonalUpRight,
      0.5
    );
    victory.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    victory.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
    victory.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
    victory.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.5);

    return new fp.GestureEstimator([thumbsUp, thumbsDown, victory]);
  };

  // Request access to the webcam and play the stream
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          webcamRef.current.onloadedmetadata = () => {
            webcamRef.current?.play();
          };
        }
      } catch (err) {
        setError("Error accessing camera: " + (err as Error).message);
        setLoading(false);
      }
    };

    setupCamera();
  }, []);

  // Load the TensorFlow.js handpose model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
        const handposeModel = await handpose.load();
        setModel(handposeModel);
        setLoading(false);
        console.log("Handpose model loaded successfully");
      } catch (err) {
        setError("Error loading model: " + (err as Error).message);
        setLoading(false);
        console.error("Failed to load handpose model:", err);
      }
    };

    loadModel();
  }, []);

  // Main hand detection and gesture recognition loop
  useEffect(() => {
    let animationFrameId: number;
    const gestureEstimator = createGestureEstimator();
    let lastGestureTime = 0;
    let stableGestureCount = 0;
    let currentStableGesture = "";

    const detectHands = async () => {
      if (!model || !webcamRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(detectHands);
        return;
      }

      const video = webcamRef.current;

      if (video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(detectHands);
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        const hands = await model.estimateHands(video);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (hands.length > 0) {
          const hand = hands[0];
          drawHandLandmarks(hand.landmarks, ctx);

          const gesture = gestureEstimator.estimate(hand.landmarks, 7.5);

          interface GestureResult {
            name: string;
            score: number;
          }

          if (gesture.gestures && gesture.gestures.length > 0) {
            const confidences = gesture.gestures.map(
              (g: GestureResult) => g.score
            );
            const maxConfidence = Math.max(...confidences);
            const maxConfidenceIndex = confidences.indexOf(maxConfidence);
            const detectedGesture = gesture.gestures[
              maxConfidenceIndex
            ] as GestureResult;

            setGestureName(detectedGesture.name);
            setConfidence(maxConfidence);

            const now = Date.now();

            // Only trigger callback when the gesture is stable for a while
            if (
              detectedGesture.name === currentStableGesture &&
              maxConfidence > 0.8
            ) {
              stableGestureCount++;

              if (stableGestureCount > 15 && now - lastGestureTime > 2000) {
                if (onGestureDetected) {
                  onGestureDetected(detectedGesture.name);
                  lastGestureTime = now;
                  stableGestureCount = 0;
                }
              }
            } else {
              currentStableGesture = detectedGesture.name;
              stableGestureCount = 1;
            }
          } else {
            setGestureName("No gesture detected");
            setConfidence(0);
            currentStableGesture = "";
            stableGestureCount = 0;
          }
        } else {
          setGestureName("No hand detected");
          setConfidence(0);
          currentStableGesture = "";
          stableGestureCount = 0;
        }
      } catch (err) {
        console.error("Error during hand detection:", err);
      }

      animationFrameId = requestAnimationFrame(detectHands);
    };

    detectHands();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [model, onGestureDetected]);

  // Render hand landmarks and bones between them
  const drawHandLandmarks = (
    landmarks: any[],
    ctx: CanvasRenderingContext2D
  ) => {
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
    }

    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [0, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [0, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20],
      [5, 9],
      [9, 13],
      [13, 17],
    ];

    for (const [i, j] of connections) {
      const [x1, y1] = landmarks[i];
      const [x2, y2] = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const getGestureIcon = () => {
    switch (gestureName) {
      case "thumbs_up":
        return "👍";
      case "thumbs_down":
        return "👎";
      case "victory":
        return "✌️";
      default:
        return "👋";
    }
  };

  const getGestureLabel = () => {
    switch (gestureName) {
      case "thumbs_up":
        return "Thumbs Up (Easy)";
      case "thumbs_down":
        return "Thumbs Down (Hard)";
      case "victory":
        return "Victory Sign (Wrong)";
      case "No hand detected":
        return "No hand detected";
      default:
        return "No gesture detected";
    }
  };

  return (
    <div className="gesture-recognizer">
      <div className="webcam-container">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div>Loading hand tracking model...</div>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        <video
          ref={webcamRef}
          autoPlay
          playsInline
          muted
          className="webcam-video"
        />
        <canvas ref={canvasRef} className="gesture-canvas" />

        <div
          className={`gesture-label ${
            gestureName !== "No hand detected" ? "active" : ""
          }`}
        >
          <span className="gesture-icon">{getGestureIcon()}</span>
          <span className="gesture-text">{getGestureLabel()}</span>
          {confidence > 0 && (
            <div className="confidence-bar">
              <div
                className="confidence-level"
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      <div className="instructions-panel">
        <h3>Gesture Instructions:</h3>
        <div className="gesture-instructions">
          <div className="gesture-instruction">
            <div className="gesture-icon">👍</div>
            <div className="gesture-description">
              <strong>Thumbs Up:</strong> Easy
            </div>
          </div>
          <div className="gesture-instruction">
            <div className="gesture-icon">👎</div>
            <div className="gesture-description">
              <strong>Thumbs Down:</strong> Hard
            </div>
          </div>
          <div className="gesture-instruction">
            <div className="gesture-icon">✌️</div>
            <div className="gesture-description">
              <strong>Victory Sign:</strong> Wrong
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestureRecognizer;
