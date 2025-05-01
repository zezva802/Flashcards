Frontend Specification
The frontend consists of several React components that interact with backend services to manage flashcard-based learning. The main components include PracticeView, FlashcardDisplay, and GestureRecognizer. Additionally, api.ts handles API requests, while index.ts defines the data structures used throughout the application.

1. Components:
   a) PracticeView.tsx
   This is the core component of the flashcard practice session, and its responsibilities include:

Loading the flashcards for the current day.

Managing the study session state (e.g., which card is currently being studied, what day it is in the practice session).

Allowing the user to submit their answers and adjust the difficulty of the flashcards.

Optionally using gesture recognition for accessibility and alternative input.

Handling transitions between days of the practice session.

Key Functions/Behavior:

State Management: Uses hooks like useState, useEffect, and useRef to manage the practice session’s state, including current card index, session status, and loading state.

Flashcard Display: Displays the current flashcard, tracks progress, and allows users to rate difficulty after seeing the answer.

Gesture Controls: The component optionally integrates gesture recognition for advancing through the flashcards (using GestureRecognizer).

API Interaction: Communicates with the backend using the fetchPracticeCards, submitAnswer, and advanceDay functions from api.ts to load cards, submit answers, and advance to the next day.

Progress Indicators: Displays the user's progress through the current session and session completion status.

b) FlashcardDisplay.tsx
This component is responsible for displaying the flashcards in the practice session:

Card Flip: It shows the front of the flashcard, and when the user presses "Show Answer", it flips the card to show the back.

User Interaction: It enables the user to engage with the card content, i.e., view questions and answers.

Responsibility: Primarily visual, rendering flashcards, and exposing a key (via key={cardKey}) to re-render when the user advances to the next flashcard.

c) GestureRecognizer.tsx
This component is an optional feature that allows gesture-based controls for interacting with the flashcards:

Gestures: Handles gestures like thumbs-up (Easy), thumbs-down (Hard), and victory sign (Wrong) to rate answers.

Gesture Feedback: Provides feedback after each gesture is detected and maps it to answer difficulties.

Cooldown System: Ensures gestures can’t be repeated too quickly, preventing accidental multiple inputs.

2. Services (api.ts):
   This file contains functions to interact with the backend API to manage the flashcard data.

Key Functions/Behavior:
fetchPracticeCards: Fetches the list of flashcards and the current study day from the backend. The API response is mapped to the PracticeSession interface.

submitAnswer: Sends the user’s answer for a flashcard along with the difficulty rating (easy, hard, wrong) to the backend.

fetchHint: Fetches hints for a specific flashcard, if applicable.

fetchProgress: Retrieves the user's progress statistics, including the total number of cards learned and the completion percentage.

advanceDay: Advances the practice session to the next day, triggering the loading of new flashcards for the next day.

3. Types (index.ts):
   Defines various data structures and enums used across the frontend.

Key Types/Behavior:
Flashcard Class:

Represents a single flashcard with a front, back, hint, and tags.

Immutable class with read-only properties.

AnswerDifficulty Enum:

Represents the possible difficulty ratings for a flashcard answer.

Values:

Wrong = 0

Hard = 1

Easy = 2

PracticeSession Interface:

Represents a practice session, including an array of Flashcard objects and the current study day.

UpdateRequest Interface:

Represents the data sent from the frontend when submitting an answer. Includes the cardFront, cardBack, and the difficulty rating.

ProgressStats Interface:

Represents the user’s overall progress, including the number of flashcards, learned cards, completion percentage, and detailed stats on cards by bucket.

4. State and Props:
   State Management in PracticeView:

practiceCards: Array of flashcards for the current session.

currentCardIndex: Index of the flashcard the user is currently studying.

showBack: Flag indicating whether the back of the card (answer) is shown.

isLoading: Flag indicating whether the cards are currently being fetched.

sessionFinished: Flag indicating whether all flashcards for the day have been studied.

gestureMessage: Message that provides feedback after a gesture is detected.

day: Current practice day.

Props in Components:

FlashcardDisplay receives the card and showBack state as props.

GestureRecognizer receives the onGestureDetected function as a prop.

5. Parallel Breakdown (Backend and Extension Parallels)
   Backend Parallels:

PracticeView.tsx is similar to the backend’s handling of the study session (/practice route). It loads cards for the current day and tracks session progress.

submitAnswer and advanceDay from api.ts mirror backend endpoints for submitting answers and advancing days (/update and /day/next).

Flashcard and AnswerDifficulty in index.ts reflect the backend models that define flashcards and answer difficulty.

Extension Directory Parallels:

The frontend (specifically PracticeView.tsx) provides an interface for users to interact with flashcards, akin to how the extension handles user input, progress tracking, and display.

The API calls in api.ts can be compared to the backend routes that return the necessary data (e.g., flashcards, progress).

GestureRecognizer.tsx adds an extra layer of interactivity, similar to how extensions might handle alternate input methods (e.g., keyboard shortcuts, gestures, or voice commands).
