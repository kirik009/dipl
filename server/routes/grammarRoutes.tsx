import type { Express } from "express";
 
import { storage } from "../storage";
import {  InsertGrammarTopic, insertGrammarTopicSchema} from "@shared/schema";
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



  app.get("/api/grammar-topics/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const grammarTopic = await storage.getGrammarTopic(id);
      
      if (!grammarTopic) {
        return res.status(404).json({ message: "Grammar topic not found" });
      }
      
      res.json(grammarTopic);
    } catch (error) {
      next(error);
    }
  });

     app.delete("/api/grammar-topics/:id", async (req, res, next) => {
      try {
        if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
          return res.status(403).json({ message: "Not authorized" });
        }
        
        const id = parseInt(req.params.id);
        await storage.deleteGrammarTopic(id);
        
        res.sendStatus(204);
      } catch (error) {
        next(error);
      }
    });

    app.post("/api/grammar-topics", async (req, res, next) => {
      try {
        if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
          return res.status(403).json({ message: "Not authorized" });
        }
        
        const topic = await storage.createGrammarTopic();
        
        res.status(201).json(topic);
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

 app.put("/api/grammar-topics/:id", async (req, res, next) => {
          try {
            if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
              return res.status(403).json({ message: "Not authorized" });
            }
            
            const id = parseInt(req.params.id);
            const validatedData = insertGrammarTopicSchema.parse(req.body);
            
            const updatedTopic = await storage.updateGrammarTopic(id, validatedData);
            
            if (!updatedTopic) {
              return res.status(404).json({ message: "Grammar topic not found" });
            }
            
            res.json(updatedTopic);
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
}