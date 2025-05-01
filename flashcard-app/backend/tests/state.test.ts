import {
    getBuckets,
    setBuckets,
    getHistory,
    addHistoryRecord,
    getCurrentDay,
    incrementDay,
    findCard,
    findCardBucket,
    resetState,
  } from "../src/state";
  
  import { Flashcard, AnswerDifficulty } from "../src/logic/flashcards";
  import { PracticeRecord } from "../src/types/index";
  
  describe("Flashcard state management", () => {
    let sampleCard: Flashcard;
  
    beforeEach(() => {
      resetState();
      const allCards = Array.from(getBuckets().values()).flatMap(set => Array.from(set));
      sampleCard = allCards[0];
    });
  
    it("should get initial flashcard from buckets", () => {
      const buckets = getBuckets();
      const cards = Array.from(buckets.values()).flatMap(set => Array.from(set));
      expect(cards.length).toBeGreaterThan(0);
      expect(typeof cards[0].front).toBe("string");
      expect(typeof cards[0].back).toBe("string");
    });
  
    it("should increment and fetch current day", () => {
      expect(getCurrentDay()).toBe(0);
      incrementDay();
      expect(getCurrentDay()).toBe(1);
    });
  
    it("should add and get history records", () => {
      const record: PracticeRecord = {
        cardFront: sampleCard.front,
        cardBack: sampleCard.back,
        difficulty: AnswerDifficulty.Easy,
        timestamp: Date.now(),
        previousBucket: 0,
        newBucket: 1
      };
  
      addHistoryRecord(record);
      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject(record);
    });
  
    it("should find a flashcard by front and back", () => {
      const found = findCard(sampleCard.front, sampleCard.back);
      expect(found).toBeDefined();
      expect(found?.front).toBe(sampleCard.front);
      expect(found?.back).toBe(sampleCard.back);
    });
  
    it("should find the bucket of a flashcard", () => {
      const bucket = findCardBucket(sampleCard);
      expect(bucket).toBe(0);
    });
  
    it("should reset the entire state", () => {
      // Mutate state
      incrementDay();
      const record: PracticeRecord = {
        cardFront: sampleCard.front,
        cardBack: sampleCard.back,
        difficulty: AnswerDifficulty.Hard,
        timestamp: Date.now(),
        previousBucket: 0,
        newBucket: 2
      };
      addHistoryRecord(record);
  
      // Assert mutation worked
      expect(getCurrentDay()).toBe(1);
      expect(getHistory()).toHaveLength(1);
  
      // Reset and assert state cleared
      resetState();
  
      expect(getCurrentDay()).toBe(0);
      expect(getHistory()).toHaveLength(0);
      const buckets = getBuckets();
      const cards = Array.from(buckets.values()).flatMap(set => Array.from(set));
      expect(cards.length).toBeGreaterThan(0);
    });
  });
  