import express, { Request, Response } from 'express';
import cors from 'cors';
import { toBucketSets, getBucketRange, practice, update, getHint, computeProgress } from "./logic/algorithm";
import { getBuckets, setBuckets, getHistory, addHistoryRecord, getCurrentDay, incrementDay, findCard, findCardBucket } from "./state";
import { Flashcard, AnswerDifficulty, BucketMap } from "./logic/flashcards";
import { PracticeSession, UpdateRequest, HintRequest, ProgressStats, PracticeRecord } from "./types/index";



const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/practice', (req,res)=> {
    try{
        const day = getCurrentDay();
        const bucketsMap = getBuckets();
        const bucketSets = toBucketSets(bucketsMap);
        const cards = Array.from(practice(bucketSets,day));
        console.log(`Returning ${cards.length} cards for the dat ${day}`);
        res.json({cards, day});
    } catch (error) {
        console.error("Error getting practice cards:", error);
        res.status(500).json({error: "Failed to get practice cards."});
    }
});


app.post('/api/update', (req: Request<{}, {}, UpdateRequest>, res: Response) => {
    try {
        const { cardFront, cardBack, difficulty } = req.body;

        

        // ⚡ Convert the string to enum
        // This casting is safe because the check above ensures it's a valid key
        

        const card = findCard(cardFront, cardBack);
        if (!card) {
            return res.status(404).json({ error: "card not found." });
        }

        const currentBuckets = getBuckets();
        const previousBucket = findCardBucket(card);

        const updatedBuckets = update(currentBuckets, card, difficulty);
        setBuckets(updatedBuckets);

        const newBucket = findCardBucket(card);
        const record: PracticeRecord = {
            cardFront: card.front,
            cardBack: card.back,
            timestamp: Date.now(),
            difficulty: difficulty,
            previousBucket,
            newBucket
        };

        addHistoryRecord(record);

        console.log(`card updated from ${previousBucket} to ${newBucket}`);
        res.status(200).json({ message: "card updated successfully." });
    } catch (error) {
        console.error("Error updating card:", error);
        res.status(500).json({ error: "failed to update card." });
    }
});


app.get('/api/hint', (req,res) => {
    try{
        const { cardFront, cardBack } = req.query;
        // Add checks to ensure these are strings, as query parameters are often parsed as such
        if (typeof cardFront !== 'string' || typeof cardBack !== 'string'){
            return res.status(400).json({error: "Missing or invalid query parameters."});
        }

        const card = findCard(cardFront,cardBack);
        if (!card) return res.status(404).json({error: "Card not found."});

        const hint = getHint(card);
        console.log(`Hint requested for card: ${cardFront}`);
        res.json({hint});
    } catch (error) {
        console.error("Error getting hint:", error);
        res.status(500).json({error: "Failed to get hint."});
    }
});

app.get('/api/progress', (req, res) => {
    try {
      const buckets = getBuckets();
      // history is not directly used in computeProgress based on the import and original code,
      // but it might be if the computeProgress function was different. Keeping it for context.
      const history = getHistory();
      const progress = computeProgress(buckets); // Assuming computeProgress takes buckets
      res.json({ progress });
    } catch (error) {
      console.error("Error computing progress:", error);
      res.status(500).json({ error: 'Failed to compute progress.' });
    }
});

app.post('/api/day/next', (req, res) => {
    try {
      incrementDay();
      const newDay = getCurrentDay();
      console.log(`Day advanced to ${newDay}`);
      res.status(200).json({ message: 'Day advanced.', newDay });
    } catch (error) {
      console.error("Error advancing day:", error);
      res.status(500).json({ error: 'Failed to increment day.' });
    }
});


app.post('/api/flashcards', (req: Request, res: Response) => {
  try {
    const { front, back, hint, tags } = req.body;

    if (!front || !back) {
      return res.status(400).json({ error: "Front and back are required." });
    }

    const card = new Flashcard(
      front,
      back,
      hint || '',
      Array.isArray(tags) ? tags : undefined
    );

    const currentBuckets = getBuckets();
    const updatedBuckets = new Map(currentBuckets);

    if (!updatedBuckets.has(0)) {
      updatedBuckets.set(0, new Set());
    }

    updatedBuckets.get(0)?.add(card);
    setBuckets(updatedBuckets);

    console.log(`New card added: "${front}"`);
    res.status(201).json({ message: "Flashcard created successfully." });
  } catch (error) {
    console.error("Error creating flashcard:", error);
    res.status(500).json({ error: "Failed to create flashcard." });
  }
});

  

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;