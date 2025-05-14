import type { Express } from "express";

import { storage } from "../storage";
import { insertExerciseSchema,  submitExerciseSchema, insertTaskSchema, insertTaskProgressSchema, insertAssignedTaskSchema } from "@shared/schema";
import { z } from "zod";
import { type } from "os";

export async function assignTasksRoutes(app: Express) { 

  app.get(`/api/assignedTasks/:id`, async (req, res, next) => {
    try {
      const assignedTaskId = parseInt(req.params.id);
      const exercises = await storage.getAssignedTasks(assignedTaskId);
      res.json(exercises);
    } catch (error) {
      next(error);
    }
  });

   app.get(`/api/assignedExpiredTasks/:id`, async (req, res, next) => {
    try {
      const assignedTaskId = parseInt(req.params.id);
      const exercises = await storage.getAssignedExpiredTasks(assignedTaskId);
      res.json(exercises);
    } catch (error) {
      next(error);
    }
  });

    app.get(`/api/assignedSolvedTasks/:id`, async (req, res, next) => {
    try {
      const assignedTaskId = parseInt(req.params.id);
      const exercises = await storage.getAssignedSolvedTasks(assignedTaskId);
      res.json(exercises);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/assignedTasks/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const exerciseId = parseInt(req.params.id);
      const { dueDate, ...rest} = req.body;
                  const validatedData = insertAssignedTaskSchema.parse({
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : null,
        });
                  
      
      const updatedExercise = await storage.updateAssignedTask(exerciseId, validatedData);
      
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


   app.patch("/api/assignedTasks/:taskId", async (req, res, next) => {
    try {
      
      const taskId = parseInt(req.params.taskId);
  
      const updatedExercise = await storage.solveAssignedTask(taskId);
      
      if (!updatedExercise) {
        return res.status(404).json({ message: "Assigned task not found" });
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


  app.put("/api/assignedTasks/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const exerciseId = parseInt(req.params.id);
      const { dueDate, ...rest} = req.body;
                  const validatedData = insertAssignedTaskSchema.parse({
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : null,
        });
                  
      
      const updatedExercise = await storage.updateAssignedTask(exerciseId, validatedData);
      
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

          app.delete("/api/assignedTasks/:id", async (req, res, next) => {
              try {
                if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
                  return res.status(403).json({ message: "Not authorized" });
                }
                
                const exerciseId = parseInt(req.params.id);
                await storage.deleteAssignedTask(exerciseId);
                
                res.sendStatus(204);
              } catch (error) {
                next(error);
              }
            });

            app.post("/api/assignedTasks", async (req, res, next) => {
                try {
                  if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
                    return res.status(403).json({ message: "Not authorized" });
                  }
                   const { dueDate, ...rest} = req.body;
                  const validatedData = insertAssignedTaskSchema.parse({
  ...rest,
  dueDate: dueDate ? new Date(dueDate) : null,
});
                  
                  
                  
                  const exercise = await storage.createAssignedTask(validatedData);
                  
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
}