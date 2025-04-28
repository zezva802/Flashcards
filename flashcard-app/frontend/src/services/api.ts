import axios from 'axios';
import { PracticeSession, UpdateRequest, ProgressStats, Flashcard, AnswerDifficulty } from '../types';  // Adjust imports based on your types location

const API_BASE_URL = 'http://localhost:3001/api'; // Make sure port 3001 is correct and matches your backend

// Create axios instance with base URL and default headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * fetchPracticeCards - Fetches the practice session data, including flashcards.
 * 
 * @returns {Promise<PracticeSession>} The practice session data.
 * @throws Error if the request fails.
 */
export const fetchPracticeCards = async (): Promise<PracticeSession> => {
  try {
    const response = await apiClient.get('/practice');
    return response.data;
  } catch (error) {
    console.error("Error fetching practice cards:", error);
    throw error;
  }
};

/**
 * submitAnswer - Submits the user's answer for the current flashcard.
 * 
 * @param {string} cardFront - The front of the flashcard.
 * @param {string} cardBack - The back of the flashcard.
 * @param {AnswerDifficulty} difficulty - The difficulty level for the answer.
 * @throws Error if the request fails.
 */
export const submitAnswer = async (cardFront: string, cardBack: string, difficulty: AnswerDifficulty): Promise<void> => {
  try {
    const payload: UpdateRequest = { cardFront, cardBack, difficulty };
    await apiClient.post('/update', payload);
  } catch (error) {
    console.error("Error submitting answer:", error);
    throw error;
  }
};

/**
 * fetchHint - Fetches a hint for a specific flashcard.
 * 
 * @param {Flashcard} card - The flashcard for which to fetch a hint.
 * @returns {Promise<string>} The hint for the card.
 * @throws Error if the request fails.
 */
export const fetchHint = async (card: Flashcard): Promise<string> => {
  try {
    const response = await apiClient.get('/hint', { 
      params: { cardFront: card.front, cardBack: card.back } 
    });
    return response.data.hint;
  } catch (error) {
    console.error("Error fetching hint:", error);
    throw error;
  }
};

/**
 * fetchProgress - Fetches the user's progress statistics.
 * 
 * @returns {Promise<ProgressStats>} The user's progress data.
 * @throws Error if the request fails.
 */
export const fetchProgress = async (): Promise<ProgressStats> => {
  try {
    const response = await apiClient.get('/progress');
    return response.data.progress;
  } catch (error) {
    console.error("Error fetching progress:", error);
    throw error;
  }
};

/**
 * advanceDay - Advances to the next day in the practice session.
 * 
 * @returns {Promise<{ currentDay: number }>} The new day number.
 * @throws Error if the request fails.
 */
export const advanceDay = async (): Promise<{ currentDay: number }> => {
  try {
    const response = await apiClient.post('/day/next');
    return response.data;
  } catch (error) {
    console.error("Error advancing day:", error);
    throw error;
  }
};
