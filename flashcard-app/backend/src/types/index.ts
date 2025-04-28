import { Flashcard, AnswerDifficulty, BucketMap } from "@logic/flashcards";

// --- API Data Structures ---

/**
 * Represents the data structure for a practice session response.
 * Contains the cards to be reviewed and the current day context.
 */
export interface PracticeSession {
    cards: Flashcard[];
    day: number; // Represents the current day number in the system/simulation
}


/**
 * Represents the data structure for updating a card's state after review.
 * Sent from the client to the backend.
 */
export interface UpdateRequest {
    cardFront: string;
    cardBack: string;
    difficulty: AnswerDifficulty;
}


/**
 * Represents the data structure for requesting a hint for a card.
 */
export interface HintRequest{
    cardFront: string;
    cardBack: string;
}

/**
 * Represents summary statistics about the user's learning progress.
 * Based on the kind of information derived from the `computeProgress` function
 * and general progress tracking needs.
 */
export interface ProgressStats {
    /** Total number of flashcards currently being tracked. */
    totalCards: number;
    /** Number of cards considered "learned" (e.g., in buckets >= threshold). */
    cardsLearned: number; // Corresponds to highBucketCards in computeProgress
    /** Overall completion percentage based on learned cards. */
    completionPercentage: number; // The direct output of computeProgress
    /** Map of bucket number (key) to the count of cards currently in that bucket (value). */
    cardsByBucket: Record<number, number>; // Still useful even if not the direct output
     /** Optional: The bucket number threshold used to define "learned". */
    learningThreshold?: number;
}

/**
 * Represents a single recorded interaction with a flashcard during practice.
 * Used as input history for progress calculation or logging. This structure logs
 * the state *before* and *after* the interaction.
 */
export interface PracticeRecord {
    cardFront: string;
    cardBack: string;
    timestamp: number; // Unix timestamp (e.g., milliseconds since epoch) of the review
    difficulty: AnswerDifficulty; // How the user answered
    previousBucket?: number; // The bucket the card was in *before* this interaction
    newBucket?: number; // The bucket the card moved to *after* this interaction
}

