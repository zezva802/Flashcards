import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import * as fp from "fingerpose";
import "@tensorflow/tfjs-backend-webgl";
import "./GestureRecognizer.css";

/**
 * Props interface for the GestureRecognizer component
 *
 * @property onGestureDetected Optional callback function that is triggered when a stable gesture is recognized
 *                             Receives the name of the detected gesture as a string parameter
 */
interface GestureRecognizerProps {
  onGestureDetected?: (gesture: string) => void;
}

/**
 * GestureRecognizer component uses TensorFlow.js and the Handpose model
 * to detect and recognize hand gestures through the webcam.
 *
 * The component:
 * - Accesses the user's webcam
 * - Loads and runs the TensorFlow.js handpose model
 * - Recognizes specific gestures (thumbs up, thumbs down, victory sign)
 * - Visualizes hand landmarks and detection confidence
 * - Provides visual feedback about detected gestures
 * - Triggers callbacks when stable gestures are recognized
 *
 * @param props Component props containing optional callbacks
 * @returns React component that renders the gesture recognition interface
 * @spec.requires WebGL support in browser
 * @spec.requires User grants camera access permissions
 */
const GestureRecognizer: React.FC<GestureRecognizerProps> = ({
  onGestureDetected,
}) => {
  // Refs for accessing the webcam video and canvas drawing elements
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State variables to manage the component's operation
  const [model, setModel] = useState<handpose.HandPose | null>(null); // The loaded handpose model
  const [gestureName, setGestureName] = useState<string>("No gesture detected"); // Currently detected gesture
  const [loading, setLoading] = useState<boolean>(true); // Loading state for the model
  const [error, setError] = useState<string | null>(null); // Error messages
  const [confidence, setConfidence] = useState<number>(0); // Confidence level of current gesture detection

  /**
   * Creates a gesture estimator with custom gesture descriptions
   *
   * This function defines the gesture patterns that the system will recognize:
   * - Thumbs up: Thumb extended upward, other fingers curled
   * - Thumbs down: Thumb extended downward, other fingers curled
   * - Victory: Index and middle fingers extended upward in a V shape
   *
   * @returns A configured GestureEstimator instance ready to detect the defined gestures
   * @spec.behavior Each gesture has specific finger positions, curls, and directions
   *                with confidence weights assigned to each condition
   */
  const createGestureEstimator = () => {
    // Define the thumbs up gesture
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

    // Define the thumbs down gesture
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

    // Define the victory sign gesture
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

    // Create and return the gesture estimator with all defined gestures
    return new fp.GestureEstimator([thumbsUp, thumbsDown, victory]);
  };

  /**
   * Effect hook to set up webcam access when component mounts
   *
   * @spec.effect Requests camera access and connects the webcam stream to the video element
   * @spec.sideEffects
   *   - Sets error state if camera access fails
   *   - Starts video playback when metadata is loaded
   */
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

  /**
   * Effect hook to load the TensorFlow.js handpose model when component mounts
   *
   * @spec.effect Initializes TensorFlow backends and loads the handpose model
   * @spec.sideEffects
   *   - Updates loading state during and after model loading
   *   - Sets error state if model loading fails
   *   - Stores the loaded model in component state
   */
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

  /**
   * Main effect hook that runs the continuous hand detection and gesture recognition loop
   *
   * @spec.effect Creates a continuous detection loop using requestAnimationFrame
   * @spec.behavior
   *   - Detects hands in each video frame
   *   - Draws hand landmarks on the canvas
   *   - Recognizes gestures and calculates confidence scores
   *   - Triggers callbacks only when gestures are stable for multiple frames
   *   - Implements a cooldown period between gesture detections
   * @spec.cleanup Cancels the animation frame when component unmounts
   */
  useEffect(() => {
    let animationFrameId: number;
    const gestureEstimator = createGestureEstimator();
    let lastGestureTime = 0;
    let stableGestureCount = 0;
    let currentStableGesture = "";

    /**
     * Recursive function that runs the detection loop
     *
     * @spec.behavior Runs continuously using requestAnimationFrame until component unmounts
     */
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
        // Detect hand landmarks in the current video frame
        const hands = await model.estimateHands(video);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (hands.length > 0) {
          const hand = hands[0];
          // Draw hand landmarks and connections
          drawHandLandmarks(hand.landmarks, ctx);

          // Estimate gesture from landmarks
          const gesture = gestureEstimator.estimate(hand.landmarks, 7.5);

          interface GestureResult {
            name: string;
            score: number;
          }

          if (gesture.gestures && gesture.gestures.length > 0) {
            // Find the gesture with highest confidence
            const confidences = gesture.gestures.map(
              (g: GestureResult) => g.score
            );
            const maxConfidence = Math.max(...confidences);
            const maxConfidenceIndex = confidences.indexOf(maxConfidence);
            const detectedGesture = gesture.gestures[
              maxConfidenceIndex
            ] as GestureResult;

            // Update state with detected gesture info
            setGestureName(detectedGesture.name);
            setConfidence(maxConfidence);

            const now = Date.now();

            // Stability tracking - only trigger callback when gesture is consistent
            if (
              detectedGesture.name === currentStableGesture &&
              maxConfidence > 0.8
            ) {
              stableGestureCount++;

              // Trigger callback after gesture is stable for multiple frames and after cooldown period
              if (stableGestureCount > 15 && now - lastGestureTime > 2000) {
                if (onGestureDetected) {
                  onGestureDetected(detectedGesture.name);
                  lastGestureTime = now;
                  stableGestureCount = 0;
                }
              }
            } else {
              // Reset stability tracking for new gesture
              currentStableGesture = detectedGesture.name;
              stableGestureCount = 1;
            }
          } else {
            // No recognizable gesture detected
            setGestureName("No gesture detected");
            setConfidence(0);
            currentStableGesture = "";
            stableGestureCount = 0;
          }
        } else {
          // No hand detected in the frame
          setGestureName("No hand detected");
          setConfidence(0);
          currentStableGesture = "";
          stableGestureCount = 0;
        }
      } catch (err) {
        console.error("Error during hand detection:", err);
      }

      // Continue the detection loop
      animationFrameId = requestAnimationFrame(detectHands);
    };

    // Start the detection loop
    detectHands();

    // Cleanup function to stop the detection loop when component unmounts
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [model, onGestureDetected]);

  /**
   * Draws hand landmarks and connections between them on the canvas
   *
   * @param landmarks Array of [x,y,z] coordinates representing hand keypoints
   * @param ctx Canvas rendering context for drawing
   * @spec.behavior
   *   - Draws circular dots for each landmark point
   *   - Draws lines connecting landmarks to visualize the hand skeleton
   */
  const drawHandLandmarks = (
    landmarks: any[],
    ctx: CanvasRenderingContext2D
  ) => {
    // Draw each landmark point
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
    }

    // Define connections between landmarks to form the hand skeleton
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

    // Draw lines for each connection
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

  /**
   * Returns an emoji icon representing the current detected gesture
   *
   * @returns Emoji string representing the current gesture
   */
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

  /**
   * Returns a user-friendly label for the current detected gesture
   *
   * @returns Human-readable string describing the current gesture and its meaning
   */
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

  /**
   * Component render function
   *
   * @returns JSX for the gesture recognition interface including:
   *   - Webcam video feed
   *   - Canvas overlay for hand visualization
   *   - Loading/error states
   *   - Gesture detection feedback
   *   - Instructions panel
   */
  return (
    <div className="gesture-recognizer">
      <div className="webcam-container">
        {/* Loading overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div>Loading hand tracking model...</div>
          </div>
        )}

        {/* Error message display */}
        {error && <div className="error-message">{error}</div>}

        {/* Webcam video element */}
        <video
          ref={webcamRef}
          autoPlay
          playsInline
          muted
          className="webcam-video"
        />

        {/* Canvas overlay for hand tracking visualization */}
        <canvas ref={canvasRef} className="gesture-canvas" />

        {/* Gesture detection feedback display */}
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

      {/* Instructions panel showing available gestures */}
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
