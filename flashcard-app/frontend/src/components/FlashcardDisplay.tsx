import React, { useState } from 'react';
import { Flashcard } from '../types';  
import { fetchHint } from '../services/api';  

interface Props {
  card: Flashcard;
  showBack: boolean;
}

/**
 * FlashcardDisplay Component
 * 
 * Displays a flashcard with an optional hint feature. The component shows the front 
 * and optionally the back of the card, and allows the user to get a hint for the back of the card.
 * 
 * Props:
 * - card (Flashcard): The flashcard to display, containing 'front' and 'back'.
 * - showBack (boolean): Determines whether to show the back of the card.
 * 
 * Invariants:
 * - card.front and card.back must be valid strings.
 * - showBack must be a boolean value.
 */
const FlashcardDisplay: React.FC<Props> = ({ card, showBack }) => {
  // Invariant: Ensure card.front and card.back are valid strings.
  if (!card.front || !card.back) {
    throw new Error('Invalid flashcard. Both front and back are required.');
  }

  // Invariant: Ensure showBack is a boolean.
  if (typeof showBack !== 'boolean') {
    throw new Error('showBack must be a boolean.');
  }

  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [hintError, setHintError] = useState<string | null>(null);

  /**
   * handleGetHint - Fetches a hint for the current flashcard.
   * 
   * This function makes an API request to fetch a hint based on the provided
   * flashcard, updates the UI with the result or displays an error if the request fails.
   * 
   * @throws Error if the fetch request fails.
   */
  const handleGetHint = async (): Promise<void> => {
    setLoadingHint(true);
    setHintError(null);
    try {
      const fetchedHint = await fetchHint(card);
      setHint(fetchedHint);
    } catch (error) {
      setHintError('Failed to fetch hint.');
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className="flashcard">
      <div className="flashcard-content">
        <div className="flashcard-front">
          <p>{card.front}</p>
        </div>
        {showBack ? (
          <div className="flashcard-back">
            <p>{card.back}</p>
          </div>
        ) : (
          <div className="flashcard-back">
            <p>???</p>
          </div>
        )}
      </div>

      {!showBack && (
        <div>
          <button onClick={handleGetHint} disabled={loadingHint}>
            {loadingHint ? 'Loading Hint...' : 'Get Hint'}
          </button>
          {hint && !hintError && <p className="hint">{hint}</p>}
          {hintError && <p className="hint-error">{hintError}</p>}
        </div>
      )}

      <style>{`
        .flashcard {
          border: 1px solid #ccc;
          padding: 20px;
          margin: 10px;
          text-align: center;
          border-radius: 8px;
          width: 250px;
        }
        .flashcard-content {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 150px;
          margin-bottom: 10px;
        }
        .flashcard-front {
          font-size: 20px;
          font-weight: bold;
        }
        .flashcard-back {
          font-size: 18px;
        }
        .hint {
          color: green;
          font-weight: bold;
        }
        .hint-error {
          color: red;
          font-weight: bold;
        }
        button {
          padding: 10px 15px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default FlashcardDisplay;
