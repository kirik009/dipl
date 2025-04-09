import type { Express } from "express";
 
import { storage } from "../storage";
import { insertExerciseSchema,  submitExerciseSchema, insertTaskSchema, insertTaskProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function grammarRoutes(app: Express) { 
  app.get("/api/grammar-topics", async (req, res, next) => {
    try {
      const topics = await storage.getGrammarTopics();
      res.json(topics);
    } catch (error) {
      next(error);
    }
  });
}