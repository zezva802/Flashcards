import React, { useState, useEffect } from "react";
import { Flashcard } from "../types";
import { fetchHint } from "../services/api";
import "./FlashcardDisplay.css";

interface FlashcardDisplayProps {
  card: Flashcard;
  showBack: boolean;
}

const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({
  card,
  showBack,
}) => {
  if (!card.front || !card.back) {
    throw new Error("Invalid flashcard. Both front and back are required.");
  }

  if (typeof showBack !== "boolean") {
    throw new Error("showBack must be a boolean.");
  }

  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [hintError, setHintError] = useState<string | null>(null);

  // Reset hint state when card changes
  useEffect(() => {
    setHint(null);
    setHintError(null);
    setLoadingHint(false);
  }, [card.front, card.back]);

  // Handle fetching a hint for the current flashcard
  const handleGetHint = async (): Promise<void> => {
    setLoadingHint(true);
    setHintError(null);
    try {
      const fetchedHint = await fetchHint(card);
      setHint(fetchedHint);
    } catch {
      setHintError("Failed to fetch hint.");
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className={`flashcard ${showBack ? "flipped" : ""}`}>
      <div className="flashcard-inner">
        {/* Front side of the flashcard */}
        <div className="flashcard-front">
          <div className="flashcard-content">
            <h3>Question</h3>
            <div className="flashcard-text">{card.front}</div>

            {/* Hint section, only shown when answer is hidden */}
            {!showBack && (
              <div className="hint-container">
                <button
                  className="btn btn-secondary hint-button"
                  onClick={handleGetHint}
                  disabled={loadingHint}
                >
                  {loadingHint ? "Loading..." : "Get Hint"}
                </button>

                {hint && !hintError && (
                  <div className="hint-text">
                    <span className="hint-label">Hint:</span> {hint}
                  </div>
                )}

                {hintError && <div className="hint-error">{hintError}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Back side of the flashcard */}
        <div className="flashcard-back">
          <div className="flashcard-content">
            <h3>Answer</h3>
            <div className="flashcard-text">{card.back}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardDisplay;
