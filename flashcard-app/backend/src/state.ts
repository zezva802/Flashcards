import { Flashcard, AnswerDifficulty, BucketMap } from "./logic/flashcards";
import { PracticeRecord } from "./types/index";

const initialCards: Flashcard[] = [
  new Flashcard("What is the capital of France?", "Paris", "Eiffel Tower", [
    "capitals",
  ]),
  new Flashcard("What is the capital of Georgia?", "Tbilisi", "Old Town", [
    "capitals",
  ]),
  new Flashcard("What is the capital of Japan?", "Tokyo", "Shibuya Crossing", [
    "capitals",
  ]),
  new Flashcard("What is the capital of Canada?", "Ottawa", "Parliament Hill", [
    "capitals",
  ]),
  new Flashcard("What is the capital of Italy?", "Rome", "Colosseum", [
    "capitals",
  ]),
  new Flashcard(
    "What is the capital of Australia?",
    "Canberra",
    "Australian War Memorial",
    ["capitals"]
  ),
  new Flashcard(
    "What is the capital of Brazil?",
    "Brasília",
    "Modernist Architecture",
    ["capitals"]
  ),
  new Flashcard("What is the capital of Russia?", "Moscow", "Red Square", [
    "capitals",
  ]),
  new Flashcard("What is the capital of Egypt?", "Cairo", "Pyramids of Giza", [
    "capitals",
  ]),
  new Flashcard("What is the capital of India?", "New Delhi", "India Gate", [
    "capitals",
  ]),
  new Flashcard(
    "What is the capital of South Korea?",
    "Seoul",
    "Gyeongbokgung Palace",
    ["capitals"]
  ),
  new Flashcard("What is the capital of Spain?", "Madrid", "Royal Palace", [
    "capitals",
  ]),
];

let currentBuckets: BucketMap = new Map();
currentBuckets.set(0, new Set(initialCards));
let practiceHistory: PracticeRecord[] = [];
let currentDay: number = 0;

/**
 * Fetches the current state of the flashcard buckets.
 *
 * @returns {BucketMap} A map of bucket indices to sets of flashcards.
 * Each bucket represents a group of flashcards categorized by difficulty or practice status.
 */
export function getBuckets(): BucketMap {
  return currentBuckets;
}

/**
 * Sets the new state for the flashcard buckets.
 * This function updates the `currentBuckets` to reflect the new state.
 *
 * @param {BucketMap} newBuckets The new set of flashcard buckets to update.
 */
export function setBuckets(newBuckets: BucketMap): void {
  currentBuckets = newBuckets;
}

/**
 * Fetches the practice history records.
 *
 * @returns {PracticeRecord[]} An array of records documenting the user's practice.
 * Each record represents a practice attempt with the flashcard and its corresponding difficulty.
 */
export function getHistory(): PracticeRecord[] {
  return practiceHistory;
}

/**
 * Adds a new record to the practice history.
 * This record represents an interaction with a flashcard (e.g., answering a card with a certain difficulty level).
 *
 * @param {PracticeRecord} record The record to add to the history.
 */
export function addHistoryRecord(record: PracticeRecord): void {
  practiceHistory.push(record);
}

/**
 * Fetches the current day in the practice session.
 *
 * @returns {number} The current practice day, which increments as the user progresses.
 */
export function getCurrentDay(): number {
  return currentDay;
}

/**
 * Increments the current day by 1.
 * This function is called to move to the next practice day.
 */
export function incrementDay(): void {
  currentDay += 1;
}

/**
 * Finds a flashcard by its front and back text.
 *
 * @param {string} front The text on the front of the flashcard.
 * @param {string} back The text on the back of the flashcard.
 *
 * @returns {Flashcard | undefined} The flashcard if found, or undefined if not.
 */
export function findCard(front: string, back: string): Flashcard | undefined {
  for (const set of currentBuckets.values()) {
    for (const card of set) {
      if (card.front === front && card.back === back) {
        return card;
      }
    }
  }
  return undefined;
}

/**
 * Finds the bucket index of a given flashcard.
 *
 * @param {Flashcard} cardToFind The flashcard whose bucket index is to be found.
 *
 * @returns {number | undefined} The bucket index if the card is found, or undefined if not.
 */
export function findCardBucket(cardToFind: Flashcard): number | undefined {
  for (const [bucket, set] of currentBuckets.entries()) {
    if (set.has(cardToFind)) {
      return bucket;
    }
  }
  return undefined;
}

/**
 * Invariant: The `currentBuckets` map must always be a valid Map object, where:
 * - Each bucket index is a non-negative integer (starting from 0).
 * - Each bucket is a Set that contains Flashcard objects.
 * - A Flashcard should only appear in one bucket at a time.
 */
/**
 * Invariant: The `practiceHistory` array must contain valid `PracticeRecord` objects, where:
 * - Each record includes a valid flashcard (must exist in the `currentBuckets`).
 * - The difficulty must be one of the predefined valid values (Easy, Hard, Wrong).
 * - The record must correspond to a flashcard that the user interacted with.
 */
/**
 * Invariant: `currentDay` must always be a non-negative integer, representing the current practice day.
 * The day count starts at 0 and is incremented by 1 with each new practice session.
 */
/**
 * Invariant: A `Flashcard` object must always have:
 * - A non-empty string for `front` (the question side).
 * - A non-empty string for `back` (the answer side).
 * - An array of tags (`tags`) associated with the card, which can be empty.
 * - A valid `Flashcard` object must not have duplicate front/back pairs.
 */

console.log("Initial state loaded:", {
  day: currentDay,
  buckets: currentBuckets,
  cards: initialCards.length,
});



export function resetState(): void {
// Replace with however you load cards
  currentBuckets = new Map([[0, new Set(initialCards)]]);
  practiceHistory = [];
  currentDay = 0;
}

