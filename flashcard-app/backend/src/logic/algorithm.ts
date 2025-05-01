/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the autograder.
 */

import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 *
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  if (buckets.size === 0) {
    return []; // Return empty array if there are no buckets
  }

  // Determine the highest bucket number to size the array correctly
  const maxBucket = Math.max(0, ...buckets.keys());

  // Initialize an array of empty sets
  const bucketArray: Array<Set<Flashcard>> = Array.from(
    { length: maxBucket + 1 },
    () => new Set()
  );

  // Populate the array with the flashcards from the buckets map
  for (const [bucket, flashcards] of buckets.entries()) {
    bucketArray[bucket] = new Set(flashcards);
  }

  return bucketArray;
}

/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: BucketMap
): { minBucket: number; maxBucket: number } | undefined {
  const nonEmptyBuckets = Array.from(buckets.entries())
    .filter(([_, set]) => set.size > 0)
    .map(([index, _]) => index);

  if (nonEmptyBuckets.length === 0) return undefined;

  return {
    minBucket: Math.min(...nonEmptyBuckets),
    maxBucket: Math.max(...nonEmptyBuckets),
  };
}

/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  const reviewSet = new Set<Flashcard>();

  buckets.forEach((flashcards, index) => {
    if (day % (index + 1) === 0) {
      flashcards.forEach((card) => reviewSet.add(card));
    }
  });

  return reviewSet;
}

/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
  let currentBucket = 0;

  // Find the card's current bucket
  for (const [bucket, flashcards] of buckets) {
    if (flashcards.has(card)) {
      currentBucket = bucket;
      flashcards.delete(card);
      break;
    }
  }

  // Determine new bucket
  let newBucket =
    difficulty === AnswerDifficulty.Wrong
      ? 0
      : difficulty === AnswerDifficulty.Hard
      ? currentBucket + 1
      : currentBucket + 2;

  // Ensure newBucket is within valid range
  newBucket = Math.max(0, newBucket);

  // Add the card to the new bucket
  if (!buckets.has(newBucket)) {
    buckets.set(newBucket, new Set());
  }
  buckets.get(newBucket)!.add(card);

  return buckets;
}

/**
 * Generates a hint for a flashcard.
 *
 * @param card flashcard to hint
 * @returns a hint for the front of the flashcard.
 * @spec.requires card is a valid Flashcard.
 */
export function getHint(card: Flashcard): string {
  return card.hint;
}

/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets representation of learning buckets.
 * @param history representation of user's answer history.
 * @returns statistics about learning progress.
 * @spec.requires [SPEC TO BE DEFINED]
 */
export function computeProgress(buckets: BucketMap): number {
  let totalCards = 0;
  let highBucketCards = 0;
  const threshold = 3; // Buckets ≥ 3 are considered "learned"

  for (const [bucket, flashcards] of buckets) {
    totalCards += flashcards.size;
    if (bucket >= threshold) {
      highBucketCards += flashcards.size;
    }
  }

  const completion = totalCards > 0 ? (highBucketCards / totalCards) * 100 : 0;
  return completion;
}
