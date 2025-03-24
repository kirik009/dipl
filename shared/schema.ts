import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  level: text("level").notNull().default("beginner"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("sentence-builder"),
  difficulty: text("difficulty").notNull().default("intermediate"),
  grammarTopic: text("grammar_topic").notNull(),
  translation: text("translation").notNull(),
  correctSentence: text("correct_sentence").notNull(),
  words: text("words").array().notNull(),
  grammarExplanation: text("grammar_explanation"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  isCorrect: boolean("is_correct").notNull(),
  userAnswer: text("user_answer").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const grammarTopics = pgTable("grammar_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  level: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  type: true,
  difficulty: true,
  grammarTopic: true,
  translation: true,
  correctSentence: true,
  words: true,
  grammarExplanation: true,
  tags: true,
  createdBy: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  exerciseId: true,
  isCorrect: true,
  userAnswer: true,
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
  exerciseId: z.number(),
  userAnswer: z.string(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type GrammarTopic = typeof grammarTopics.$inferSelect;
export type InsertGrammarTopic = z.infer<typeof insertGrammarTopicSchema>;
