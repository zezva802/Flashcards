import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import * as fp from "fingerpose";
import "@tensorflow/tfjs-backend-webgl";

const GestureRecognizer: React.FC = () => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [gestureName, setGestureName] = useState<string>("No gesture detected");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define gestures
  const createGestureEstimator = () => {
    // Thumbs Up gesture
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

    // Add curl for other fingers
    for (let finger of [
      fp.Finger.Index,
      fp.Finger.Middle,
      fp.Finger.Ring,
      fp.Finger.Pinky,
    ]) {
      thumbsUp.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
    }

    // Thumbs Down gesture
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

    // Add curl for other fingers
    for (let finger of [
      fp.Finger.Index,
      fp.Finger.Middle,
      fp.Finger.Ring,
      fp.Finger.Pinky,
    ]) {
      thumbsDown.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
    }

    // Victory gesture
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

    // Other fingers should be curled
    victory.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    victory.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
    victory.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
    victory.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.5);

    return new fp.GestureEstimator([thumbsUp, thumbsDown, victory]);
  };

  // Initialize the camera
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

  // Load the handpose model
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Initialize TensorFlow.js
        await tf.setBackend("webgl");
        await tf.ready();

        // Load the handpose model
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

  // Detect hands and gestures
  useEffect(() => {
    let animationFrameId: number;
    const gestureEstimator = createGestureEstimator();

    const detectHands = async () => {
      if (!model || !webcamRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(detectHands);
        return;
      }

      const video = webcamRef.current;

      // Make sure video is ready
      if (video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(detectHands);
        return;
      }

      // Get video properties
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Set canvas dimensions to match video
      const canvas = canvasRef.current;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      try {
        // Detect hands
        const hands = await model.estimateHands(video);

        // Draw results on canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (hands.length > 0) {
          // Get the first detected hand
          const hand = hands[0];

          // Draw hand landmarks
          drawHandLandmarks(hand.landmarks, ctx);

          // Estimate gestures
          const gesture = gestureEstimator.estimate(hand.landmarks, 7.5);

          // Define an interface for the gesture result
          interface GestureResult {
            name: string;
            score: number;
          }

          if (gesture.gestures && gesture.gestures.length > 0) {
            // Find gesture with highest confidence
            const confidences = gesture.gestures.map(
              (g: GestureResult) => g.score
            );
            const maxConfidence = Math.max(...confidences);
            const maxConfidenceIndex = confidences.indexOf(maxConfidence);

            // Update state with detected gesture name
            const detectedGesture = gesture.gestures[
              maxConfidenceIndex
            ] as GestureResult;
            setGestureName(
              `${detectedGesture.name} (${maxConfidence.toFixed(2)})`
            );
          } else {
            setGestureName("No gesture detected");
          }
        } else {
          setGestureName("No hand detected");
        }
      } catch (err) {
        console.error("Error during hand detection:", err);
      }

      // Continue detection loop
      animationFrameId = requestAnimationFrame(detectHands);
    };

    // Start detection loop
    detectHands();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [model]);

  // Helper function to draw hand landmarks
  const drawHandLandmarks = (
    landmarks: any[],
    ctx: CanvasRenderingContext2D
  ) => {
    // Draw dots at each landmark point
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i];

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }

    // Draw connections between landmarks
    // Define connections based on hand anatomy
    const connections = [
      // Thumb
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      // Index finger
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      // Middle finger
      [0, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      // Ring finger
      [0, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      // Pinky
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20],
      // Palm
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
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  return (
    <div className="gesture-recognizer">
      <div
        className="webcam-container"
        style={{ position: "relative", width: 640, height: 480 }}
      >
        {loading && (
          <div
            className="loading-overlay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              zIndex: 10,
            }}
          >
            Loading model... This may take a moment.
          </div>
        )}

        {error && (
          <div
            className="error-message"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255, 0, 0, 0.7)",
              color: "white",
              zIndex: 10,
            }}
          >
            {error}
          </div>
        )}

        <video
          ref={webcamRef}
          autoPlay
          playsInline
          muted
          style={{
            transform: "scaleX(-1)",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: "scaleX(-1)",
            zIndex: 1,
          }}
        />

        <div
          className="gesture-label"
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "4px",
            zIndex: 2,
            fontSize: "18px",
          }}
        >
          {gestureName}
        </div>
      </div>

      <div
        className="instructions"
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: "#f0f0f0",
          borderRadius: 5,
        }}
      >
        <h3>Instructions:</h3>
        <p>Show one of these gestures to the camera:</p>
        <ul>
          <li>
            <strong>Thumbs Up:</strong> Point thumb up with other fingers curled
          </li>
          <li>
            <strong>Thumbs Down:</strong> Point thumb down with other fingers
            curled
          </li>
          <li>
            <strong>Victory:</strong> Extend index and middle fingers in a V
            shape
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GestureRecognizer;
