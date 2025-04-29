 import type { Express } from "express";
 
 import { storage } from "../storage";
 import { insertExerciseSchema,  submitExerciseSchema, insertTaskSchema, insertTaskProgressSchema } from "@shared/schema";
 import { z } from "zod";
 
 export async function taskRoutes(app: Express) { 
 app.get("/api/tasks", async (req, res, next) => {
      try {
        const tasks = await storage.getTasks();
        res.json(tasks);
      } catch (error) {
        next(error);
      }
    });
  
    app.get("/api/tasks/:id", async (req, res, next) => {
      try {
        const taskId = parseInt(req.params.id);
        const task = await storage.getTask(taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        res.json(task);
      } catch (error) {
        next(error);
      }
    });

    app.get("/api/task_prog/:id", async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const taskProgress = await storage.getTaskProgress(id);
        
        if (!taskProgress) {
          return res.status(404).json({ message: "Task progress not found" });
        }
        
        res.json(taskProgress);
      } catch (error) {
        next(error);
      }
    });

    app.post("/api/tasks/prog", async (req, res, next) => {
        try {
          if (!req.isAuthenticated() || req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
          }
          
          const validatedData = insertTaskProgressSchema.parse(req.body);
          const taskProgress = await storage.CreateTaskProgress({
            ...validatedData,
          });
          
          res.status(201).json(taskProgress);
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

      app.put("/api/tasks/:id", async (req, res, next) => {
          try {
            if (!req.isAuthenticated() || req.user.role !== "admin") {
              return res.status(403).json({ message: "Not authorized" });
            }
            
            const taskId = parseInt(req.params.id);
            const validatedData = insertTaskSchema.parse(req.body);
            
            const updatedTask = await storage.updateTask(taskId, validatedData);
            
            if (!updatedTask) {
              return res.status(404).json({ message: "Exercise not found" });
            }
            
            res.json(updatedTask);
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


        app.put("/api/task_prog/:id", async (req, res, next) => {
          try {
            if (!req.isAuthenticated() || req.user.role !== "admin") {
              return res.status(403).json({ message: "Not authorized" });
            }
            
            const taskProgId = parseInt(req.params.id);
          
            
            const updatedTask = await storage.updateTaskProg(taskProgId);
            
            if (!updatedTask) {
              return res.status(404).json({ message: "Exercise not found" });
            }
           
            res.json(updatedTask);
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


        app.delete("/api/tasks/:id", async (req, res, next) => {
            try {
              if (!req.isAuthenticated() || req.user.role !== "admin") {
                return res.status(403).json({ message: "Not authorized" });
              }
              
              const taskId = parseInt(req.params.id);
              await storage.deleteTask(taskId);
              
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
      const exerciseProgress = await storage.createExerciseProgress({
        userId: req.user.id,
        exerciseId: validatedData.exerciseId,
        isCorrect,
        userAnswer: validatedData.userAnswer,
        taskProgressId: validatedData.taskProgressId,
      });

      //   const progress =  await storage.manageTaskProgress({ 
      //     userId: req.user.id,
      //     taskId: validatedData.taskId,
      //     correctAnswers: isCorrect ? 1 : 0,
      // });
    
      res.status(201).json({
        ...exerciseProgress,
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
}