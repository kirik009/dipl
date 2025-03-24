import { users, type User, type InsertUser, 
         exercises, type Exercise, type InsertExercise, 
         userProgress, type UserProgress, type InsertUserProgress, 
         grammarTopics, type GrammarTopic, type InsertGrammarTopic 
       } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interfaces for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Exercise methods
  getExercise(id: number): Promise<Exercise | undefined>;
  getExercises(difficulty?: string, grammarTopic?: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;
  
  // User progress methods
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getUserProgressSummary(userId: number): Promise<{
    totalExercises: number;
    correctExercises: number;
    incorrectExercises: number;
    accuracy: number;
    recentResults: UserProgress[];
  }>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  // Grammar topic methods
  getGrammarTopics(): Promise<GrammarTopic[]>;
  getGrammarTopic(id: number): Promise<GrammarTopic | undefined>;
  createGrammarTopic(topic: InsertGrammarTopic): Promise<GrammarTopic>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private exercises: Map<number, Exercise>;
  private userProgress: Map<number, UserProgress>;
  private grammarTopics: Map<number, GrammarTopic>;
  
  private userIdCounter: number;
  private exerciseIdCounter: number;
  private progressIdCounter: number;
  private topicIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    this.userProgress = new Map();
    this.grammarTopics = new Map();
    
    this.userIdCounter = 1;
    this.exerciseIdCounter = 1;
    this.progressIdCounter = 1;
    this.topicIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Seed data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Exercise methods
  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async getExercises(difficulty?: string, grammarTopic?: string): Promise<Exercise[]> {
    let exercises = Array.from(this.exercises.values());
    
    if (difficulty) {
      exercises = exercises.filter(e => e.difficulty === difficulty);
    }
    
    if (grammarTopic) {
      exercises = exercises.filter(e => e.grammarTopic === grammarTopic);
    }
    
    return exercises;
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseIdCounter++;
    const now = new Date();
    const exercise: Exercise = { ...insertExercise, id, createdAt: now };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async updateExercise(id: number, exerciseUpdate: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const existingExercise = this.exercises.get(id);
    if (!existingExercise) return undefined;
    
    const updatedExercise = { ...existingExercise, ...exerciseUpdate };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }

  async deleteExercise(id: number): Promise<void> {
    this.exercises.delete(id);
  }

  // User progress methods
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId);
  }

  async getUserProgressSummary(userId: number): Promise<{
    totalExercises: number;
    correctExercises: number;
    incorrectExercises: number;
    accuracy: number;
    recentResults: UserProgress[];
  }> {
    const userProgressEntries = Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId);
    
    const totalExercises = userProgressEntries.length;
    const correctExercises = userProgressEntries.filter(p => p.isCorrect).length;
    const incorrectExercises = totalExercises - correctExercises;
    const accuracy = totalExercises ? (correctExercises / totalExercises * 100) : 0;
    
    // Get recent results, sorted by completion date (newest first)
    const recentResults = [...userProgressEntries]
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, 10); // Get up to 10 most recent results
    
    return {
      totalExercises,
      correctExercises,
      incorrectExercises,
      accuracy,
      recentResults,
    };
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.progressIdCounter++;
    const now = new Date();
    const progress: UserProgress = { ...insertProgress, id, completedAt: now };
    this.userProgress.set(id, progress);
    return progress;
  }

  // Grammar topic methods
  async getGrammarTopics(): Promise<GrammarTopic[]> {
    return Array.from(this.grammarTopics.values());
  }

  async getGrammarTopic(id: number): Promise<GrammarTopic | undefined> {
    return this.grammarTopics.get(id);
  }

  async createGrammarTopic(insertTopic: InsertGrammarTopic): Promise<GrammarTopic> {
    const id = this.topicIdCounter++;
    const topic: GrammarTopic = { ...insertTopic, id };
    this.grammarTopics.set(id, topic);
    return topic;
  }

  // Seed initial data
  private async seedData() {
    // Create admin user
    const adminPassword = "$2b$10$IhEA.OJ6mfiUeV3QvP7NG.WUlKdLAUe/YUc9DHv52xiJCbSjXrX6.salt"; // password: admin123
    await this.createUser({
      username: "admin",
      password: adminPassword,
      fullName: "Admin User",
      role: "admin",
      level: "advanced",
    });

    // Create regular user
    const userPassword = "$2b$10$QxPY.WZkEx9mdumgVeSRbuVbmtIUg6SARfWRcE2EbUkZbY1hLpf8C.salt"; // password: user123
    await this.createUser({
      username: "johndoe",
      password: userPassword,
      fullName: "John Doe",
      role: "user",
      level: "intermediate",
    });

    // Create grammar topics
    const presentContinuous = await this.createGrammarTopic({
      name: "Present Continuous",
      description: "Used to describe actions happening at the moment of speaking or around the present time.",
    });

    const presentSimple = await this.createGrammarTopic({
      name: "Present Simple",
      description: "Used to describe habitual actions, general truths, and scheduled events.",
    });

    const pastSimple = await this.createGrammarTopic({
      name: "Past Simple",
      description: "Used to describe completed actions in the past.",
    });

    // Create exercises
    await this.createExercise({
      type: "sentence-builder",
      difficulty: "beginner",
      grammarTopic: "Present Continuous",
      translation: "Она сейчас читает книгу.",
      correctSentence: "She is reading a book now.",
      words: ["she", "is", "reading", "a", "book", "now", "newspaper", "the"],
      grammarExplanation: "This sentence uses the Present Continuous tense (am/is/are + verb-ing) to describe an action happening at the moment of speaking.",
      tags: ["present continuous", "reading", "beginner"],
      createdBy: 1,
    });

    await this.createExercise({
      type: "sentence-builder",
      difficulty: "intermediate",
      grammarTopic: "Present Continuous",
      translation: "Они сейчас смотрят новый фильм в кинотеатре.",
      correctSentence: "They are watching a new movie at the cinema now.",
      words: ["they", "are", "watching", "a", "new", "movie", "at", "the", "cinema", "now"],
      grammarExplanation: "This sentence uses the Present Continuous tense to describe an action happening at the moment of speaking.",
      tags: ["present continuous", "movies", "intermediate"],
      createdBy: 1,
    });

    await this.createExercise({
      type: "sentence-builder",
      difficulty: "intermediate",
      grammarTopic: "Present Simple",
      translation: "Он обычно ходит на работу пешком.",
      correctSentence: "He usually walks to work.",
      words: ["he", "usually", "walks", "to", "work", "by", "car", "drives"],
      grammarExplanation: "This sentence uses the Present Simple tense to describe a habitual action.",
      tags: ["present simple", "habits", "intermediate"],
      createdBy: 1,
    });

    await this.createExercise({
      type: "sentence-builder",
      difficulty: "advanced",
      grammarTopic: "Past Simple",
      translation: "Она купила новый компьютер на прошлой неделе.",
      correctSentence: "She bought a new computer last week.",
      words: ["she", "bought", "a", "new", "computer", "last", "week", "the", "buys", "yesterday"],
      grammarExplanation: "This sentence uses the Past Simple tense to describe a completed action in the past.",
      tags: ["past simple", "shopping", "advanced"],
      createdBy: 1,
    });
  }
}

export const storage = new MemStorage();
