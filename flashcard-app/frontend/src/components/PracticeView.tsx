import React, { useRef, useState, useEffect, useCallback } from "react";
import { Flashcard, AnswerDifficulty } from "../types";
import { fetchPracticeCards, submitAnswer, advanceDay } from "../services/api";
import FlashcardDisplay from "./FlashcardDisplay";
import GestureRecognizer from "./GestureRecognizer";
import "./PracticeView.css";

/**
 * PracticeView component is the main interface for flashcard practice sessions.
 *
 * This component manages:
 * - Loading and displaying flashcards for the current study session
 * - Tracking user progress through the deck
 * - Handling user answers and difficulty ratings
 * - Optional gesture-based control for accessibility/alternative input
 * - State transitions between cards and practice days
 *
 * @returns React component that renders the entire flashcard practice experience
 * @spec.behavior Automatically loads cards on mount and manages the complete practice workflow
 */
const PracticeView: React.FC = () => {
  // Core state for flashcard practice session
  const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]); // All cards for current session
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // Index of current card being studied
  const [showBack, setShowBack] = useState(false); // Whether card is flipped to reveal answer
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls
  const [error, setError] = useState<string | null>(null); // Error messages from API calls
  const [day, setDay] = useState(1); // Current study day (affects which cards are shown)
  const [sessionFinished, setSessionFinished] = useState(false); // Whether all cards for the day are complete
  const [cardKey, setCardKey] = useState(0); // Used to force re-render of card component when switching cards

  // Gesture control system state
  const [showGestureControls, setShowGestureControls] = useState(false); // Toggle for gesture control UI
  const [gestureMessage, setGestureMessage] = useState<string | null>(null); // Feedback message for detected gestures

  /**
   * Load flashcards when component first mounts
   *
   * @spec.effect Initiates API call to load the first set of practice cards
   */
  useEffect(() => {
    loadPracticeCards();
  }, []);

  /**
   * Fetches a new set of flashcards from the backend for the current study day
   *
   * @returns Promise that resolves when cards are loaded and state is updated
   * @spec.sideEffects
   *   - Updates practiceCards state with new cards
   *   - Updates day state with current day from backend
   *   - Resets session state (currentCardIndex, sessionFinished)
   *   - Sets error state if API call fails
   */
  const loadPracticeCards = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setSessionFinished(false);

      const practiceSession = await fetchPracticeCards();
      setPracticeCards(practiceSession.cards);
      setDay(practiceSession.day);

      if (practiceSession.cards.length === 0) {
        setSessionFinished(true);
      } else {
        setCurrentCardIndex(0);
        // Force FlashcardDisplay to reset animation/state
        setCardKey((prevKey) => prevKey + 1);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load practice cards.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reveals the back (answer) side of the current flashcard
   *
   * @spec.sideEffects
   *   - Sets showBack state to true
   *   - Clears any gesture message feedback
   */
  const handleShowBack = (): void => {
    setShowBack(true);
    setGestureMessage(null);
  };

  /**
   * Processes the user's answer difficulty rating and advances to the next card
   *
   * @param difficulty The user's rating of how difficult the card was to remember
   * @returns Promise that resolves when answer is submitted and next card is ready
   * @spec.sideEffects
   *   - Submits answer to backend API
   *   - Advances to next card or marks session as finished
   *   - Resets card display state (showBack) for next card
   *   - Sets error state if API call fails
   */
  const handleAnswer = async (difficulty: AnswerDifficulty): Promise<void> => {
    try {
      const currentCard = practiceCards[currentCardIndex];
      await submitAnswer(currentCard.front, currentCard.back, difficulty);

      setShowBack(false);
      setGestureMessage(null);

      // Wait briefly before moving to next card for user feedback
      if (currentCardIndex + 1 < practiceCards.length) {
        setTimeout(() => {
          setCurrentCardIndex((prev) => prev + 1);
          setCardKey((prevKey) => prevKey + 1); // Trigger re-render
        }, 300);
      } else {
        setSessionFinished(true); // No more cards
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit answer.");
    }
  };

  /**
   * Advances the study session to the next day
   *
   * @returns Promise that resolves when day is advanced and new cards are loaded
   * @spec.sideEffects
   *   - Calls backend API to advance to next day
   *   - Loads new practice cards for the new day
   *   - Resets card display state
   *   - Sets error state if API call fails
   */
  const handleNextDay = async (): Promise<void> => {
    try {
      await advanceDay();
      loadPracticeCards();
      setShowBack(false);
      setGestureMessage(null);
    } catch (err) {
      console.error(err);
      setError("Failed to advance to next day.");
    }
  };

  // References for gesture recognition cooldown system
  const lastGestureRef = useRef<string | null>(null); // Stores the last detected gesture
  const lastGestureTimeRef = useRef<number>(0); // Timestamp of last gesture detection

  /**
   * Handles detection of gestures and translates them into card actions
   *
   * @param gesture String identifier of the detected gesture
   * @spec.requires Card must be flipped (showBack=true) for gestures to trigger answers
   * @spec.behavior
   *   - Implements a cooldown period to prevent accidental repeated gestures
   *   - Maps gestures to specific difficulty ratings:
   *     - thumbs_up → Easy
   *     - thumbs_down → Hard
   *     - victory → Wrong
   *   - Shows visual feedback before submitting answer
   */
  const handleGestureDetected = useCallback(
    (gesture: string): void => {
      const now = Date.now();
      const cooldown = 2500; // ms

      // Prevent repeated gesture triggers
      if (
        gesture !== lastGestureRef.current ||
        now - lastGestureTimeRef.current > cooldown
      ) {
        lastGestureRef.current = gesture;
        lastGestureTimeRef.current = now;

        if (showBack) {
          let difficulty: AnswerDifficulty | null = null;
          let message = "";

          switch (gesture) {
            case "thumbs_up":
              difficulty = AnswerDifficulty.Easy;
              message = "👍 Easy";
              break;
            case "thumbs_down":
              difficulty = AnswerDifficulty.Hard;
              message = "👎 Hard";
              break;
            case "victory":
              difficulty = AnswerDifficulty.Wrong;
              message = "✌️ Wrong";
              break;
            default:
              return; // Unknown gesture
          }

          if (difficulty !== null) {
            setGestureMessage(message);
            setTimeout(() => {
              handleAnswer(difficulty);
            }, 800); // Slight delay before answer is submitted
          }
        }
      }
    },
    [showBack, handleAnswer]
  );

  /**
   * Toggles visibility of the gesture control interface
   *
   * @spec.sideEffects Inverts the showGestureControls state
   */
  const toggleGestureControls = (): void => {
    setShowGestureControls((prev) => !prev);
  };

  // Conditional rendering based on application state

  /**
   * Loading state view while cards are being fetched
   */
  if (isLoading) {
    return <div className="practice-loading">Loading flashcards...</div>;
  }

  /**
   * Error state view when API operations fail
   */
  if (error) {
    return <div className="practice-error">{error}</div>;
  }

  /**
   * Session completion view when all cards for the day are finished
   */
  if (sessionFinished) {
    return (
      <div className="practice-container session-complete">
        <h2>Session Complete!</h2>
        <p>Great job completing today's practice session!</p>
        <button className="btn btn-primary" onClick={handleNextDay}>
          Go to Next Day
        </button>
      </div>
    );
  }

  // Get current card for the active practice session
  const currentCard = practiceCards[currentCardIndex];

  /**
   * Main practice view - displays current card, progress indicators,
   * answer difficulty buttons, and optional gesture controls
   */
  return (
    <div className="practice-container">
      <div className="practice-header">
        <h2>Day {day}</h2>
        <div className="practice-controls">
          <button className={`btn btn-outline`} onClick={toggleGestureControls}>
            {showGestureControls ? "Hide" : "Show"} Gesture Controls
          </button>
        </div>
        <div className="progress-indicator">
          <span>
            Card {currentCardIndex + 1} of {practiceCards.length}
          </span>
          <div className="progress-bar">
            <div
              className="progress-filled"
              style={{
                width: `${
                  ((currentCardIndex + 1) / practiceCards.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div
        className={`content-wrapper ${
          !showGestureControls ? "full-width" : ""
        }`}
      >
        {/* Gesture recognition panel (conditionally rendered) */}
        {showGestureControls && (
          <div className="gesture-recognizer-wrapper">
            <GestureRecognizer onGestureDetected={handleGestureDetected} />
          </div>
        )}

        {/* Current flashcard display area */}
        {currentCard && (
          <div
            className={`flashcard-wrapper ${
              !showGestureControls ? "full-width" : ""
            }`}
          >
            <FlashcardDisplay
              key={cardKey}
              card={currentCard}
              showBack={showBack}
            />
            {/* Answer difficulty buttons (only shown when card is flipped) */}
            {showBack && (
              <div className="difficulty-buttons">
                {gestureMessage ? (
                  <div className="gesture-detected-message">
                    {gestureMessage}
                  </div>
                ) : (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleAnswer(AnswerDifficulty.Easy)}
                    >
                      Easy
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleAnswer(AnswerDifficulty.Wrong)}
                    >
                      Wrong
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={() => handleAnswer(AnswerDifficulty.Hard)}
                    >
                      Hard
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Show Answer button (only visible when card front is showing) */}
      {!showBack && (
        <button className="btn btn-primary" onClick={handleShowBack}>
          Show Answer
        </button>
      )}
    </div>
  );
};

export default PracticeView;
