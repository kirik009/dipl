import {type User, type InsertUser, 
  type Exercise, type InsertExercise, 
  type ExerciseProgress, type InsertExerciseProgress, 
  type GrammarTopic, type InsertGrammarTopic, 
  Task,
  InsertTask,
  InsertTaskProgress,
  TaskProgress,
  InsertAssignedTask,
  AssingedTask
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
getExercises(grammarTopic_id?: number): Promise<Exercise[]>;
createExercise(exercise: InsertExercise): Promise<Exercise>;
updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
deleteExercise(id: number): Promise<void>;
deleteExercises(): Promise<void>;
getTaskExercise(task_id?: number, seq?: number): Promise<Exercise>;

getTaskExercises(task_id?: number): Promise<(Exercise & { topicName: string | null })[]>;
getNewTaskExercises(): Promise<Exercise[]>;
assignTaskIdToUnassignedExercises(task_id?: number): Promise<number>
// Task methods
getTask(id: number): Promise<Task | undefined>;

getLatestTask(userId: number): Promise<Task | undefined>;

getTasks(): Promise<(Task & { creatorFullName: string | null })[]>;
createTask(exercise: InsertTask): Promise<Task>;
updateTask(id: number, exercise: Partial<InsertTask>): Promise<Task | undefined>;
deleteTask(id: number): Promise<void>;

// Exercise progress methods
updateTaskProg(id: number, num: any, isActive?: boolean): Promise<TaskProgress | undefined>;
getTaskExerciseProgs(taskProgId?: number): Promise<({correctSentence: string | null} & ExerciseProgress)[]>;
getLastExerciseProgress( userId: number, seq: number): Promise<ExerciseProgress>
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
getLastTaskProgress( userId: number): Promise<TaskProgress>
getTaskProgressSummary(userId: number): Promise<{
totalExercises: number;
correctExercises: number;
incorrectExercises: number;
accuracy: number;
recentResults: ExerciseProgress[];
}>;
createTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress>;

// Grammar topic methods
getGrammarTopics(): Promise<GrammarTopic[]>;
getGrammarTopic(id: number): Promise<GrammarTopic | undefined>;
deleteGrammarTopic(id: number): Promise<void>;
createGrammarTopic(): Promise<GrammarTopic>;
updateGrammarTopic(id: number, topic: Partial<InsertGrammarTopic>): Promise<GrammarTopic | undefined>;


getAssignedTasks(userId: number): Promise<(AssingedTask & { taskName: string | null } & {authorName: string | null })[]>
getAssignedExpiredTasks(userId: number): Promise<(AssingedTask & { taskName: string | null } & {authorName: string | null })[]>
getAssignedSolvedTasks(userId: number): Promise<(AssingedTask & { taskName: string | null } & {authorName: string | null })[]>
deleteAssignedTask(id: number): Promise<void>;
updateAssignedTask(id: number, exerciseUpdate: Partial<InsertAssignedTask>): Promise<AssingedTask | undefined>;
createAssignedTask(exercise: InsertAssignedTask): Promise<AssingedTask>;

// Session store
sessionStore: session.Store;
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage() 
