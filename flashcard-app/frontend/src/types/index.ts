/**
 * Represents a flashcard with a front and back.
 * Flashcards are immutable.
 */
export class Flashcard {
    // You can explore the properties of Flashcard, but do NOT modify this class.
    // Your implementation should work with the Flashcard class as given.
    public readonly front: string;
    public readonly back: string;
    public readonly hint: string; // weak hint - you will strengthen the spec for getHint()
    public readonly tags: ReadonlyArray<string>;
  
    constructor(
      front: string,
      back: string,
      hint: string,
      tags: ReadonlyArray<string>
        ) {
        this.front = front;
        this.back = back;
        this.hint = hint;
        this.tags = tags;
    }
}


/**
* Represents the user's answer difficulty for a flashcard practice trial.
*/
export enum AnswerDifficulty {
    Wrong = 0,
    Hard = 1,
    Easy = 2,
}

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
    difficulty: AnswerDifficulty; // <-- instead of AnswerDifficulty
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