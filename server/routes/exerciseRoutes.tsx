import type { Express } from "express";

import { storage } from "../storage";
import { insertExerciseSchema,  submitExerciseSchema, insertTaskSchema, insertTaskProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function exerciseRoutes(app: Express) { 
// Exercise routes
  app.get("/api/exercises", async (req, res, next) => {
    try {
      let grammarTopic_id = Number(req.query.grammarTopic_id);
      
      const exercises = await storage.getExercises(grammarTopic_id);
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

   app.get("/api/task_exercises/:id/seq/:seq", async (req, res, next) => {
        try {
          const taskId = parseInt(req.params.id);
          const seq = parseInt(req.params.seq);
          const exercise= await storage.getTaskExercise(taskId, seq);
          
          if (!exercise) {
            return res.status(404).json({ message: "Exercise for this task not found" });
          }
          
          res.json(exercise);
        } catch (error) {
          next(error);
        }
      });

      app.get("/api/task_exercises/:id", async (req, res, next) => {
        try {
          const taskId = Number(req.params.id);
          
          const exercises = await storage.getTaskExercises(taskId);
          
          if (!exercises ) {
            return res.status(404).json({ message: "Exercises for this task not found" });
          }
          
          res.json(exercises);
        } catch (error) {
          next(error);
        }
      });



      app.get("/api/new_task_exercises", async (req, res, next) => {
        try {
        
          const exercises = await storage.getNewTaskExercises();
          
          if (!exercises ) {
            return res.status(404).json({ message: "Exercises for this task not found" });
          }
          
          res.json(exercises);
        } catch (error) {
          next(error);
        }
      });

      app.get("/api/task_exercises_prog/:id", async (req, res, next) => {
        try {
          const id = parseInt(req.params.id);
          const exercises = await storage.getTaskExerciseProgs(id);
          
          if (!exercises ) {
            return res.status(404).json({ message: "Exercises for this task not found" });
          }
          
          res.json(exercises);
        } catch (error) {
          next(error);
        }
      });

      app.post("/api/exercises", async (req, res, next) => {
          try {
            if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
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
              if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
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



          app.put("/api/task_exercises/assign/:taskId", async (req, res, next) => {
            try {
              if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
                return res.status(403).json({ message: "Not authorized" });
              }
          
              const taskId = parseInt(req.params.taskId);
              if (isNaN(taskId)) {
                return res.status(400).json({ message: "Invalid task ID" });
              }
          
              const updatedCount = await storage.assignTaskIdToUnassignedExercises(taskId);
          
              res.json({ updatedCount });
            } catch (error) {
              next(error);
            }
          });



          app.delete("/api/exercises/:id", async (req, res, next) => {
            try {
              if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
                return res.status(403).json({ message: "Not authorized" });
              }
              
              const exerciseId = parseInt(req.params.id);
              await storage.deleteExercise(exerciseId);
              
              res.sendStatus(204);
            } catch (error) {
              next(error);
            }
          });


          app.delete("/api/exercises", async (req, res, next) => {
            try {
              if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
                return res.status(403).json({ message: "Not authorized" });
              }
              
              await storage.deleteExercises();
              
              res.sendStatus(204);
            } catch (error) {
              next(error);
            }
          });
}