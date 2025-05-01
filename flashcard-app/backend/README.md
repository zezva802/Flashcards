Backend Documentation

1. Server Setup
   The server is set up using Express.js, which handles routing, middleware, and HTTP requests. The server listens on port 3001 (or a port set in the environment variables).

CORS middleware is enabled to allow cross-origin requests, making it suitable for frontend-backend communication across different domains.

2. API Endpoints
   2.1. /api/practice (GET)
   Purpose: Fetch the list of flashcards for the current practice day.

Process:

The getCurrentDay() function retrieves the current day of the practice cycle.

getBuckets() fetches the current set of flashcards, which are divided into buckets.

toBucketSets() converts the bucket data into an appropriate format for use in the practice() function.

The practice() function returns a subset of flashcards based on the current day.

Response: A JSON object containing:

cards: An array of flashcards to be practiced.

day: The current practice day.

2.2. /api/update (POST)
Purpose: Update a flashcard's difficulty after a user interacts with it.

Process:

Receives cardFront, cardBack, and difficulty in the request body.

findCard() checks if the provided flashcard exists in the current buckets.

The card’s previous bucket is determined using findCardBucket().

Updates the difficulty and moves the card to a new bucket based on the updated difficulty.

Saves the updated buckets using setBuckets().

Creates a history record using addHistoryRecord().

Response: A success message indicating that the card was updated.

2.3. /api/hint (GET)
Purpose: Retrieve a hint for a specific flashcard.

Process:

cardFront and cardBack are passed as query parameters.

findCard() locates the flashcard.

The hint for the flashcard is fetched using getHint().

Response: A JSON object containing the hint for the flashcard.

2.4. /api/progress (GET)
Purpose: Fetch the user's progress based on the practice history and current buckets.

Process:

getBuckets() retrieves the current state of the flashcards.

computeProgress() calculates the user's progress based on the number of flashcards in each bucket.

Response: A JSON object containing progress statistics, such as:

Total number of cards

Number of cards learned

Progress percentage

Breakdown of cards by bucket

2.5. /api/day/next (POST)
Purpose: Increment the current practice day to move to the next day of practice.

Process:

incrementDay() increments the currentDay by 1.

Response: A message indicating that the day was advanced successfully, along with the new day number.

2.6. /api/flashcards (POST)
Purpose: Create a new flashcard and add it to the practice system.

Process:

Receives front, back, hint, and tags in the request body.

A new Flashcard object is created using the provided data.

The flashcard is added to the "0" bucket (the initial bucket).

The updated buckets are saved using setBuckets().

Response: A success message indicating that the flashcard was created successfully.

3. State Management
   Current Buckets
   The system uses a Map (named currentBuckets) to store flashcards grouped by difficulty. Each bucket represents a set of flashcards for a specific difficulty level (e.g., Easy, Hard, Wrong).

Map<number, Set<Flashcard>> is used, where:

The key is the bucket index (e.g., 0, 1, 2).

The value is a Set<Flashcard>.

Practice History
Every user interaction with a flashcard (e.g., answering a card) is logged as a PracticeRecord and stored in an array (practiceHistory). This record contains:

The flashcard front and back.

The difficulty of the answer.

The previous and new bucket of the flashcard after the difficulty update.

Current Day
The system tracks the current practice day with the currentDay variable. This value starts at 0 and increments with each practice cycle.

4. Error Handling
   Missing or invalid parameters: For example, if cardFront or cardBack is missing in the /api/hint request, an error message with a 400 status code is returned.

Card not found: If the provided flashcard cannot be found in the buckets (e.g., in the /api/update or /api/hint endpoints), a 404 status code is returned.

Server errors: Any internal errors are logged to the console, and a 500 status code is returned with a generic error message.

5. Logging and Debugging
   Console logs: Key actions, such as fetching practice cards, updating flashcards, and advancing the day, are logged for debugging purposes.

Example: "Returning X cards for the day Y"

Example: "card updated from X to Y"

6. Security Considerations
   CORS: Cross-origin resource sharing (CORS) is enabled to ensure that the backend can accept requests from a frontend on a different domain or port.

Input Validation: Proper validation ensures that invalid data does not get processed, and error messages are returned to the user with appropriate status codes.
