import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertExerciseSchema,  submitExerciseSchema, insertTaskSchema, insertTaskProgressSchema } from "@shared/schema";
import { z } from "zod";
import { taskRoutes } from "./routes/taskRoutes";
import { exerciseRoutes } from "./routes/exerciseRoutes";
import { grammarRoutes } from "./routes/grammarRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
     
  taskRoutes(app);
  exerciseRoutes(app);
  grammarRoutes(app);
 
  app.get("/api/user/progress", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const progress = await storage.getExerciseProgressSummary(req.user.id);
      res.json(progress);
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

  return createServer(app);
}
