import React, { useRef, useState, useEffect, useCallback } from "react";
import { Flashcard, AnswerDifficulty } from "../types";
import { fetchPracticeCards, submitAnswer, advanceDay } from "../services/api";
import FlashcardDisplay from "./FlashcardDisplay";
import GestureRecognizer from "./GestureRecognizer";
import "./PracticeView.css";

/**
 * Displays a practice session for flashcards. Handles card progression,
 * answer submission, and optional gesture-based input.
 */
const PracticeView: React.FC = () => {
  const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState(1);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [cardKey, setCardKey] = useState(0); // Used to force re-render on card change
  const [showGestureControls, setShowGestureControls] = useState(false);
  const [gestureMessage, setGestureMessage] = useState<string | null>(null);

  // Load practice cards and set initial state
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
        setCardKey((prevKey) => prevKey + 1); // Reset key to force FlashcardDisplay update
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load practice cards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPracticeCards();
  }, []);

  const handleShowBack = (): void => {
    setShowBack(true);
    setGestureMessage(null);
  };

  // Submit the difficulty rating for the current card and move to the next one
  const handleAnswer = async (difficulty: AnswerDifficulty): Promise<void> => {
    try {
      const currentCard = practiceCards[currentCardIndex];
      await submitAnswer(currentCard.front, currentCard.back, difficulty);

      setShowBack(false);
      setGestureMessage(null);

      if (currentCardIndex + 1 < practiceCards.length) {
        // Slight delay to allow button feedback to display
        setTimeout(() => {
          setCurrentCardIndex((prev) => prev + 1);
          setCardKey((prevKey) => prevKey + 1);
        }, 300);
      } else {
        setSessionFinished(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit answer.");
    }
  };

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

  // Gesture handling logic with cooldown to prevent multiple triggers
  const lastGestureRef = useRef<string | null>(null);
  const lastGestureTimeRef = useRef<number>(0);

  const handleGestureDetected = useCallback(
    (gesture: string): void => {
      const now = Date.now();

      if (
        gesture !== lastGestureRef.current ||
        now - lastGestureTimeRef.current > 2500
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
              return;
          }

          if (difficulty !== null) {
            setGestureMessage(message);
            setTimeout(() => {
              handleAnswer(difficulty as AnswerDifficulty);
            }, 800);
          }
        }
      }
    },
    [showBack, handleAnswer]
  );

  const toggleGestureControls = (): void => {
    setShowGestureControls((prev) => !prev);
  };

  if (isLoading) {
    return <div className="practice-loading">Loading flashcards...</div>;
  }

  if (error) {
    return <div className="practice-error">{error}</div>;
  }

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

  const currentCard = practiceCards[currentCardIndex];

  return (
    <div className="practice-container">
      <div className="practice-header">
        <h2>Day {day}</h2>
        <div className="practice-controls">
          <button
            className={`btn ${
              showGestureControls ? "btn-outline" : "btn-outline"
            }`}
            onClick={toggleGestureControls}
          >
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
        {showGestureControls && (
          <div className="gesture-recognizer-wrapper">
            <GestureRecognizer onGestureDetected={handleGestureDetected} />
          </div>
        )}

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

      {!showBack && (
        <button className="btn btn-primary" onClick={handleShowBack}>
          Show Answer
        </button>
      )}
    </div>
  );
};

export default PracticeView;
