import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { interval } from "date-fns";
import { start } from "repl";

// Экспортируем операторы для использования в запросах
export { eq, and, desc };

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  level: text("level").notNull().default("beginner"),
  createdAt: timestamp("created_at").defaultNow(),
  accuracyRate: integer("accuracy_rate"),
  correctAnswers: integer("correct_answers"),
  exercisesNumber: integer("exercises_number"),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("sentence-builder"),
  difficulty: text("difficulty").notNull().default("intermediate"),
  grammarTopic_id: integer("grammar_topic_id").references(() => grammarTopics.id),
  translation: text("translation").notNull(),
  correctSentence: text("correct_sentence").notNull(),
  words: text("words").array().notNull(),
  grammarExplanation: text("grammar_explanation"),
  tags: text("tags").array(),
  task_id: integer("task_id").references(() => tasks.id),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const exerciseProgress = pgTable("exercise_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  isCorrect: boolean("is_correct").notNull(),
  userAnswer: text("user_answer").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  taskProgressId: integer("task_progress_id").references(() => taskProgress.id).notNull(),
});

export const grammarTopics = pgTable("grammar_topics", {
  id: serial("id").primaryKey(),
  name: text("name").default(""),
  description: text("description").default(""),
});


export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  triesNumber: integer("tries_number").notNull(),
  exercisesNumber: integer("exercises_number"),
  timeConstraint: text("time_constraint").notNull(),
});

export const taskProgress = pgTable("task_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  correctAnswers: integer("correct_answers"),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  level: true,
  accuracyRate:true,
  exercisesNumber: true,
  correctAnswers: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  type: true,
  difficulty: true,
  translation: true,
  grammarTopic_id: true,
  correctSentence: true,
  words: true,
  grammarExplanation: true,
  tags: true,
  createdBy: true,
  task_id: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  name: true,
  createdBy: true,
  triesNumber: true,
  timeConstraint: true,
});

export const insertExerciseProgressSchema = createInsertSchema(exerciseProgress).pick({
  userId: true,
  exerciseId: true,
  isCorrect: true,
  userAnswer: true,
  completedAt: true,
  taskProgressId: true,
});

export const insertTaskProgressSchema = createInsertSchema(taskProgress).pick({
  id: true,
  userId: true,
  taskId: true,
  correctAnswers: true,
  completedAt: true,
});

export const insertGrammarTopicSchema = createInsertSchema(grammarTopics).pick({
  name: true,
  description: true,
});

// Zod enhanced schemas
export const registerUserSchema = insertUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const submitExerciseSchema = z.object({
  taskId: z.number(),
  exerciseId: z.number(),
  userAnswer: z.string(),
  taskProgressId: z.number(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type ExerciseProgress = typeof exerciseProgress.$inferSelect;
export type InsertExerciseProgress = z.infer<typeof insertExerciseProgressSchema>;

export type GrammarTopic = typeof grammarTopics.$inferSelect;
export type InsertGrammarTopic = z.infer<typeof insertGrammarTopicSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskProgress = typeof taskProgress.$inferSelect;
export type InsertTaskProgress = z.infer<typeof insertTaskProgressSchema>;

export enum Difficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}