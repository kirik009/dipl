import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertExerciseSchema, insertUserProgressSchema, submitExerciseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Exercise routes
  app.get("/api/exercises", async (req, res, next) => {
    try {
      let difficulty = req.query.difficulty as string;
      let grammarTopic = req.query.grammarTopic as string;
      
      const exercises = await storage.getExercises(difficulty, grammarTopic);
      res.json(exercises);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/exercises/:id", async (req, res, next) => {
    try {
      const exerciseId = parseInt(req.params.id);
      const exercise = await storage.getExercise(exerciseId);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.json(exercise);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/exercises", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const validatedData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.put("/api/exercises/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const exerciseId = parseInt(req.params.id);
      const validatedData = insertExerciseSchema.parse(req.body);
      
      const updatedExercise = await storage.updateExercise(exerciseId, validatedData);
      
      if (!updatedExercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.json(updatedExercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.delete("/api/exercises/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const exerciseId = parseInt(req.params.id);
      await storage.deleteExercise(exerciseId);
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // User progress routes
  app.post("/api/exercises/submit", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validatedData = submitExerciseSchema.parse(req.body);
      
      const exercise = await storage.getExercise(validatedData.exerciseId);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      // Check if answer is correct (normalized: lowercase, no punctuation, trimmed)
      const normalizedCorrect = exercise.correctSentence.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const normalizedAnswer = validatedData.userAnswer.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const isCorrect = normalizedCorrect === normalizedAnswer;
      
      const progress = await storage.createUserProgress({
        userId: req.user.id,
        exerciseId: validatedData.exerciseId,
        isCorrect,
        userAnswer: validatedData.userAnswer,
      });
      
      res.status(201).json({
        ...progress,
        exercise,
        isCorrect,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.get("/api/user/progress", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const progress = await storage.getUserProgressSummary(req.user.id);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  });

  // Grammar topic routes
  app.get("/api/grammar-topics", async (req, res, next) => {
    try {
      const topics = await storage.getGrammarTopics();
      res.json(topics);
    } catch (error) {
      next(error);
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
