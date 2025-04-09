import {type User, type InsertUser, 
  type Exercise, type InsertExercise, 
  type ExerciseProgress, type InsertExerciseProgress, 
  type GrammarTopic, type InsertGrammarTopic, 
  Task,
  InsertTask,
  InsertTaskProgress,
  TaskProgress
} from "@shared/schema";
import session from "express-session";

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
getExercises(difficulty?: string, grammarTopic_id?: number): Promise<Exercise[]>;
createExercise(exercise: InsertExercise): Promise<Exercise>;
updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
deleteExercise(id: number): Promise<void>;

getTaskExercise(task_id?: number): Promise<Exercise>;

getTaskExercises(task_id?: number): Promise<Exercise[]>;
// Task methods
getTask(id: number): Promise<Task | undefined>;
getTasks(): Promise<Task[]>;
createTask(exercise: InsertTask): Promise<Task>;
updateTask(id: number, exercise: Partial<InsertTask>): Promise<Task | undefined>;
deleteTask(id: number): Promise<void>;

// Exercise progress methods
updateTaskProg(id: number): Promise<TaskProgress | undefined>;
getTaskExerciseProgs(taskProgressId: number) : Promise<ExerciseProgress[]>;

getExerciseProgress(userId: number): Promise<ExerciseProgress[]>;
getExerciseProgressSummary(userId: number): Promise<{
totalExercises: number;
correctExercises: number;
incorrectExercises: number;
accuracy: number;
recentResults: ExerciseProgress[];
}>;
createExerciseProgress(progress: InsertExerciseProgress): Promise<ExerciseProgress>;


// Task progress methods
getTaskProgress(taskProgressId: number): Promise<TaskProgress>;
getTaskProgressSummary(userId: number): Promise<{
totalExercises: number;
correctExercises: number;
incorrectExercises: number;
accuracy: number;
recentResults: ExerciseProgress[];
}>;
CreateTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress>;

// Grammar topic methods
getGrammarTopics(): Promise<GrammarTopic[]>;
getGrammarTopic(id: number): Promise<GrammarTopic | undefined>;
createGrammarTopic(topic: InsertGrammarTopic): Promise<GrammarTopic>;

// Session store
sessionStore: session.Store;
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage() 
