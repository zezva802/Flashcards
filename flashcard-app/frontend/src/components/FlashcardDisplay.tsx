import React, { useState, useEffect } from "react";
import { Flashcard } from "../types";
import { fetchHint } from "../services/api";
import "./FlashcardDisplay.css";

/**
 * Props interface for the FlashcardDisplay component.
 *
 * @property card The flashcard data to display (question and answer).
 * @property showBack Boolean flag that determines whether to show the answer side.
 */
interface FlashcardDisplayProps {
  card: Flashcard; // The flashcard to display
  showBack: boolean; // Whether to show the back (answer) side
}

/**
 * Component that renders a single flashcard with front/back sides and hint functionality.
 *
 * The component displays either the front (question) or back (answer) of the card
 * based on the showBack prop. When showing the front side, users can request hints.
 *
 * @param props Component props containing card data and display state
 * @returns A rendered flashcard with appropriate content and interactive elements
 */
const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({
  card, // The current flashcard to render
  showBack, // Determines whether to show the front or back of the flashcard
}) => {
  /**
   * Input validation to ensure proper component usage.
   * Throws errors for missing card content or invalid showBack type.
   */
  if (!card.front || !card.back) {
    throw new Error("Invalid flashcard. Both front and back are required.");
  }

  if (typeof showBack !== "boolean") {
    throw new Error("showBack must be a boolean.");
  }

  /**
   * State management for the hint functionality.
   *
   * hint: Stores the text of the fetched hint
   * loadingHint: Tracks whether hint fetch is in progress
   * hintError: Stores error message if hint fetch fails
   */
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [hintError, setHintError] = useState<string | null>(null);

  /**
   * Effect hook to reset hint-related states when card changes.
   * This ensures that hints from previous cards don't persist to new cards.
   */
  useEffect(() => {
    setHint(null);
    setHintError(null);
    setLoadingHint(false);
  }, [card.front, card.back]); // Dependency array includes card content

  /**
   * Fetches a hint for the current flashcard from the API.
   * Updates component state based on fetch results.
   *
   * @async
   * @returns Promise that resolves when hint fetch completes
   * @modifies hint, hintError, and loadingHint states
   */
  const handleGetHint = async (): Promise<void> => {
    setLoadingHint(true); // Indicate loading has started
    setHintError(null); // Clear any previous errors
    try {
      const fetchedHint = await fetchHint(card); // Call API to get hint
      setHint(fetchedHint); // Store successful result
    } catch {
      setHintError("Failed to fetch hint."); // Store error message on failure
    } finally {
      setLoadingHint(false); // Always update loading state when complete
    }
  };

  /**
   * Renders the flashcard with conditional flipping animation and content display.
   * The card has a front face (question) and back face (answer).
   * Hint functionality is only available on the front face.
   */
  return (
    <div className={`flashcard ${showBack ? "flipped" : ""}`}>
      <div className="flashcard-inner">
        {/* Front side of the flashcard (question) */}
        <div className="flashcard-front">
          <div className="flashcard-content">
            <h3>Question</h3>
            <div className="flashcard-text">{card.front}</div>

            {/* Hint section: only rendered when answer is not showing */}
            {!showBack && (
              <div className="hint-container">
                <button
                  className="btn btn-secondary hint-button"
                  onClick={handleGetHint}
                  disabled={loadingHint} // Prevent multiple simultaneous requests
                >
                  {loadingHint ? "Loading..." : "Get Hint"}
                </button>

                {/* Conditional hint text display */}
                {hint && !hintError && (
                  <div className="hint-text">
                    <span className="hint-label">Hint:</span> {hint}
                  </div>
                )}

                {/* Error message display if hint fetch fails */}
                {hintError && <div className="hint-error">{hintError}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Back side of the flashcard (answer) */}
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
