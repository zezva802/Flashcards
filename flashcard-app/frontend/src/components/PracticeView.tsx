import React, { useState, useEffect } from "react";
import { Flashcard, AnswerDifficulty } from "../types";
import { fetchPracticeCards, submitAnswer, advanceDay } from "../services/api";
import FlashcardDisplay from "./FlashcardDisplay";
import GestureRecognizer from "./GestureRecognizer";

/**
 * PracticeView Component
 *
 * Displays the practice session for flashcards. It loads the cards, allows the user to view the answer,
 * submit answers, and proceed to the next day once the session is finished.
 *
 * Props:
 * - None.
 *
 * Invariants:
 * - practiceCards must be an array of Flashcard objects.
 * - currentCardIndex must be a number within the bounds of practiceCards array.
 * - showBack must be a boolean.
 * - isLoading must be a boolean.
 * - error must be either a string or null.
 * - day must be a number.
 * - sessionFinished must be a boolean.
 */
const PracticeView: React.FC = () => {
  const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState(1);
  const [sessionFinished, setSessionFinished] = useState(false);
  console.log("showback: " + showBack);

  /**
   * loadPracticeCards - Fetches the practice cards from the API and sets the session state.
   *
   * Fetches the practice cards for the session, sets the day, and determines if the session
   * is finished or if there are more cards to display.
   *
   * @throws Error if the fetch request fails.
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
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load practice cards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered");
    loadPracticeCards();
  }, []);

  /**
   * handleShowBack - Reveals the back of the current flashcard.
   */
  const handleShowBack = (): void => {
    setShowBack(true);
  };

  /**
   * handleAnswer - Submits the user's answer and progresses to the next card or finishes the session.
   *
   * @param difficulty - The difficulty level chosen by the user for the current answer.
   * @throws Error if the answer submission fails.
   */
  const handleAnswer = async (difficulty: AnswerDifficulty): Promise<void> => {
    try {
      const currentCard = practiceCards[currentCardIndex];
      await submitAnswer(currentCard.front, currentCard.back, difficulty);

      if (currentCardIndex + 1 < practiceCards.length) {
        setCurrentCardIndex((prev) => prev + 1);
        setShowBack(false);
      } else {
        setSessionFinished(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit answer.");
    }
  };

  /**
   * handleNextDay - Advances to the next day of the practice session.
   *
   * @throws Error if advancing to the next day fails.
   */
  const handleNextDay = async (): Promise<void> => {
    try {
      await advanceDay();
      loadPracticeCards();
      setShowBack(false);
    } catch (err) {
      console.error(err);
      setError("Failed to advance to next day.");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (sessionFinished) {
    return (
      <div style={{ textAlign: "center" }}>
        <h2>Session Complete!</h2>
        <button onClick={handleNextDay}>Go to Next Day</button>
      </div>
    );
  }

  const currentCard = practiceCards[currentCardIndex];

  return (
    <div style={{ textAlign: "center" }}>
      <GestureRecognizer />
      <h2>Day {day}</h2>
      <p>
        Card {currentCardIndex + 1} of {practiceCards.length}
      </p>

      {currentCard && (
        <FlashcardDisplay card={currentCard} showBack={showBack} />
      )}

      {!showBack ? (
        <button onClick={handleShowBack} style={{ marginTop: "10px" }}>
          Show Answer
        </button>
      ) : (
        <div style={{ marginTop: "10px" }}>
          <button onClick={() => handleAnswer(AnswerDifficulty.Easy)}>
            Easy
          </button>
          <button onClick={() => handleAnswer(AnswerDifficulty.Wrong)}>
            Wrong
          </button>
          <button onClick={() => handleAnswer(AnswerDifficulty.Hard)}>
            Hard
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeView;
